# 🚗 AI Car Advisor — Recommendation Web App & User Feedback System

AI Car Advisor is an intelligent vehicle recommendation platform tailored for car buyers in Thailand. Users take an intuitive questionnaire (budget, income, driving pains/gains, body style, powertrain, brand preferences, priority) to receive matching car recommendations with accurate 5-year Total Cost of Ownership (TCO) estimates, affordability ratios, and risk ratings.

---

## 🏗️ Architecture

- **Frontend**: Next.js 13.5 (App Router), React 18, TypeScript, Tailwind/Custom CSS.
  - Dark Graphite (`#121419`, `#1f2228`) palette with Gold Accent (`#c9a14a`) and Ivory Text (`#f5f1e8`).
  - Typography: Oswald (Headlines) & Space Grotesk (Body).
  - 100% mobile-first (min 375px width, >= 44px tap targets, accessible `aria-live` toasts).
- **Backend**: FastAPI (Python 3.7+), Pydantic v2 schemas, SQLAlchemy 2.0 ORM, SQLite database.
- **Database**: SQLite (`feedback.db`) storing anonymous feedback, quiz answers snapshot, recommended cars, and metrics.

---

## 🚀 Running the Project

### 1. Start the Backend API (FastAPI)

```bash
# Navigate to backend directory and start server
cd backend
python run.py
# Or directly via uvicorn:
# uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Swagger UI Documentation: `http://localhost:8000/docs`

### 2. Start the Frontend (Next.js)

```bash
# In another terminal:
cd frontend
npm run dev
```
- Frontend Web App: `http://localhost:3000`
- Feedback Page: `http://localhost:3000/feedback`

---

## 💬 User Feedback Feature

To continually refine recommendation scoring and detect confusing quiz steps, AI Car Advisor includes a multi-touchpoint feedback mechanism:

### 1. Inline Recommendation Rating (`<RecommendationRating>`)
- Displayed prominently below the **top recommended vehicle** on the results page.
- Prompt: *"Was this recommendation right for you?"* with 👍 / 👎 buttons.
- On 👍: Instantly logs positive rating and shows *"Thanks — this helps us improve."*
- On 👎: Expands inline reason chips (multi-select):
  - `Too expensive`
  - `Wrong body type`
  - `Don't like the look`
  - `Want an EV`
  - `Too small`
  - `Too big`
  - `Other` (opens free-text textarea, max 300 characters with live counter).
- Submitting collapses the form and acknowledges user input while allowing rating updates.

### 2. Quick "This Question is Unclear" Button (`<UnclearQuestionButton>`)
- Appears at the bottom of every quiz question (Steps 1 to 6 in Frame stage).
- Single-click action logs `question_id` and quiz stage without opening long dialogs.
- Renders an accessible polite toast notification: *"✓ Noted — thanks for letting us know!"*

### 3. Full Feedback Page (`/feedback`)
- Accessible via the site-wide footer (`"💬 Give Feedback / แจ้งข้อเสนอแนะ"`).
- Fields:
  1. **Feedback Type** (Required): Recommendation quality, Bug, Missing car model, Suggestion, Other.
  2. **Advisor Rating** (Optional): Interactive 1–5 stars.
  3. **Message** (Required): 10–1000 characters with live character counter.
  4. **"Which car did you end up buying?"** (Optional): Text field helping engineers verify if recommended cars matched actual purchase decisions.
  5. **Email Address** (Optional): Only if the user requests a reply.
  6. **PDPA Consent Checkbox** (Required): Includes interactive privacy modal explaining anonymous data practices.
- Form validation: Submit button disabled until valid, inline error guidance, loading spinner, and success view with navigation back to results.

### 4. Privacy & Rate Limiting
- **Anonymous Tracking**: Uses a random UUID stored in `localStorage` (`car_advisor_session_id`).
- **Zero PII**: NEVER records name, phone number, or IP address.
- **Rate Limit**: Built-in backend protection limiting submissions to **max 20 per session_id per hour** (returns `429 Too Many Requests` when exceeded).

---

## 📊 Admin Feedback Summary API

Inspect feedback metrics, top dissatisfaction reasons, and model accuracy via `GET /api/feedback/summary`.

### Admin Authentication Header
Protected by header `X-API-Key` (defaults to `car-advisor-admin-secret` or custom via `FEEDBACK_ADMIN_KEY` environment variable).

### Querying with cURL

```bash
curl -X GET "http://localhost:8000/api/feedback/summary" \
     -H "X-API-Key: car-advisor-admin-secret"
```

### Example JSON Output

```json
{
  "total_submissions": 42,
  "thumbs_up_count": 28,
  "thumbs_down_count": 8,
  "full_form_count": 4,
  "unclear_question_count": 2,
  "top_down_reasons": [
    { "reason": "Too expensive", "count": 5 },
    { "reason": "Want an EV", "count": 3 },
    { "reason": "Wrong body type", "count": 2 }
  ],
  "most_flagged_unclear_questions": [
    { "question_id": "budget_income", "stage": 1, "count": 2 }
  ],
  "purchased_in_top3_percentage": 75.0
}
```

---

## 🧪 Automated Testing

Backend test suite verifying payload validation, rate limiting, and summary analytics:

```bash
python -m pytest backend/tests/test_feedback.py -v
```

Frontend production build check:

```bash
npm --prefix frontend run build
```

---

## 🧮 Matching Engine v2 (IS spec section 4)

`POST /api/v2/recommend` — filters first, then a personal weighted score. The old fixed-weight engine stays at `POST /api/recommend` as the comparison baseline.

| Step | What it does | Code |
|---|---|---|
| Filters | brand only / brand exclude / seats / fuel / budget ceiling — removed, never just scored low | `matching.apply_filters` |
| Weights | 5 cards in 3 zones (3/2/1 pts), weight = points ÷ total | `matching.weights_from_priorities` |
| Budget | full marks within budget, penalty by % over budget, cut beyond stretch (default 15%) | `matching.score_budget` |
| Lifestyle | 7 lifestyles, each = share of features the car has; unknown data skipped, never 0 | `matching.lifestyle_fit` |
| Running cost, safety, design | per spec 4.5 | `matching.score_*` |

All tunable numbers live in `backend/app/matching_config.py`. `GET /api/v2/options` returns labels and defaults for the frontend.

### Car data (spec section 3)
- Extra fields per car: `backend/app/data/car_specs.json`, built by `python backend/scripts/build_car_specs.py`.
- **Most new fields are rule-based estimates** and listed in each car's `estimated` array. Put verified values in `backend/app/data/car_specs_overrides.json` and rebuild; verified fields drop out of `estimated` automatically.
- Review sheet: `backend/app/data/car_specs_audit.csv`.

### Test personas & evaluation (spec section 7)
- 8 personas: `backend/tests/personas.json`
- Run both engines: `python backend/scripts/run_personas.py` → `docs/evaluation/` (comparison table, blind sheet for evaluators, answer key — don't show the key to evaluators)
- Tests: `python -m pytest backend/tests -v`
