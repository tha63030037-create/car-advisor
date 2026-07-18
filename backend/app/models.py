from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class QuizState(BaseModel):
    budget: int
    income: int
    pains: List[str]
    gains: List[str]
    bodytype: str
    fuel: str
    brands: List[str]

class CarPhoto(BaseModel):
    file: str
    credit: Optional[str] = None

class Car(BaseModel):
    id: int
    name: str
    bodyType: str
    fuelType: str
    price: int
    consumption: str
    seats: int
    lifestyle: List[str]
    serviceNetwork: str
    nationality: str
    transmission: str
    horsepower: int
    warrantyYears: int
    warrantyKm: int
    airbags: int
    photo: CarPhoto

class TCOBreakdown(BaseModel):
    insurance5yr: float
    maint5yr: float
    resaleValue: float
    total5yr: float

class RangeInfo(BaseModel):
    type: str
    range: Optional[int] = None
    tankSize: Optional[int] = None
    range100: Optional[int] = None
    range80: Optional[int] = None

class RiskNote(BaseModel):
    icon: str
    text: str

class Review(BaseModel):
    author: str
    rating: int
    text: str
    source: Optional[str] = "คลับผู้ใช้จริงในไทย (HeadlightMag / Pantip / Facebook Club)"
    title: Optional[str] = None
    link: Optional[str] = None
    is_live: Optional[bool] = False

class Complaint(BaseModel):
    issue: str
    frequency: str
    source: Optional[str] = "คลับผู้ใช้จริงในไทย (HeadlightMag / Pantip / Facebook Club)"

class RecommendationResult(BaseModel):
    car: Car
    score: int
    reasons: List[str]
    tco: TCOBreakdown
    monthlyInstallment: float
    affordabilityRatio: float
    affordabilityLabel: str
    affordabilityCls: str
    rangeInfo: RangeInfo
    riskNotes: List[RiskNote]
    reviews: List[Review]
    complaints: List[Complaint]
