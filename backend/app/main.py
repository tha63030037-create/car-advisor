# -*- coding: utf-8 -*-
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List
from app.database import CARS
from app.models import QuizState, RecommendationResult, Car, Review
from app.services import generate_recommendations

app = FastAPI(
    title="Car Advisor Recommendation API",
    description="Backend API serving car recommendation logic and TCO analysis.",
    version="1.0.0"
)

# Configure CORS so our Next.js frontend can call the endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development mode
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <html>
        <head>
            <meta charset="utf-8">
            <title>Car Advisor Backend API</title>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Prompt:wght@400;600&display=swap" rel="stylesheet">
            <style>
                body {
                    background-color: #0B0F19;
                    background-image: 
                        radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.18) 0%, transparent 40%);
                    color: #F8FAFC;
                    font-family: 'Prompt', 'Plus Jakarta Sans', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                }
                .container {
                    text-align: center;
                    border: 1px solid rgba(139, 92, 246, 0.4);
                    padding: 44px 36px;
                    border-radius: 24px;
                    background-color: rgba(17, 24, 39, 0.85);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(139, 92, 246, 0.2);
                    max-width: 480px;
                }
                h1 { 
                    background: linear-gradient(135deg, #C084FC 0%, #38BDF8 50%, #34D399 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-top: 0; margin-bottom: 12px; font-size: 26px; font-weight: 800; 
                }
                p { color: #94A3B8; line-height: 1.65; margin-bottom: 24px; font-size: 15px; }
                .links { display: flex; flex-direction: column; gap: 14px; }
                a { 
                    display: block;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2));
                    border: 1px solid rgba(139, 92, 246, 0.5);
                    border-radius: 999px;
                    color: #ffffff; 
                    text-decoration: none; 
                    font-weight: 700;
                    font-size: 15px;
                    transition: all 0.25s ease;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
                }
                a:hover { 
                    background: linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%);
                    border-color: transparent;
                    color: #ffffff;
                    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.5);
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚗 Car Advisor API Server</h1>
                <p>ระบบเซิร์ฟเวอร์ Backend (FastAPI) ประมวลผลแนะนำรถยนต์สไตล์ไซเบอร์เทคโฉมใหม่</p>
                <div class="links">
                    <a href="/docs" target="_blank">📖 เปิดดูคู่มือทดสอบ API (Swagger Docs)</a>
                    <a href="/api/cars" target="_blank">📦 ดึงฐานข้อมูลรถยนต์ทั้งหมด 125 คัน (JSON)</a>
                </div>
            </div>
        </body>
    </html>
    """

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Car Advisor API is up and running."}

@app.get("/api/cars", response_model=List[Car])
def get_all_cars():
    """
    Returns the complete list of 125 cars inside the database.
    """
    # Map raw CARS dicts to Pydantic Car models
    car_objs = []
    for car in CARS:
        car_objs.append(Car(
            id=car['id'],
            name=car['name'],
            bodyType=car['bodyType'],
            fuelType=car['fuelType'],
            price=car['price'],
            consumption=car['consumption'],
            seats=car['seats'],
            lifestyle=car['lifestyle'],
            serviceNetwork=car['serviceNetwork'],
            nationality=car['nationality'],
            transmission=car['transmission'],
            horsepower=car['horsepower'],
            warrantyYears=car['warrantyYears'],
            warrantyKm=car['warrantyKm'],
            airbags=car['airbags'],
            photo={
                "file": car['photo']['file'],
                "credit": car['photo']['credit']
            }
        ))
    return car_objs

@app.post("/api/recommend", response_model=List[RecommendationResult])
def get_recommendations(state: QuizState):
    """
    Computes scores for all cars based on user questionnaire answers,
    calculates TCO estimates, and returns the top 5 matches.
    """
    return generate_recommendations(state)

@app.get("/api/reviews/{car_name}", response_model=List[Review])
def get_live_reviews(car_name: str):
    """
    Fetches real-time web reviews from Pantip/HeadlightMag/One2Car via Google API or search engine.
    """
    from app.review_service import fetch_realtime_reviews
    raw_reviews = fetch_realtime_reviews(car_name)
    return [
        Review(
            author=r.get("author", "ผู้ใช้จริง"),
            rating=r.get("rating", 5),
            text=r.get("text", ""),
            source=r.get("source", "เว็บรีวิวชั้นนำ"),
            title=r.get("title"),
            link=r.get("link"),
            is_live=r.get("is_live", False)
        )
        for r in raw_reviews
    ]

