# PRD — SIH26089: Cooperative Gig Services Platform
**Ministry of Cooperation | Internal Hackathon: 11–12 Sept 2026 | Team: 2 | Stack: MERN (plain JS)**

---

## 1. One-Line Pitch (for PPT slide 1)
A cooperative-owned alternative to Urban Company — connecting verified Labour Cooperative Society workers (electricians, plumbers, carpenters, etc.) directly with households, so income stays with workers instead of a private platform's commission. Aligned with the Ministry of Cooperation's "Sahkar Se Samriddhi" push toward formalizing the informal skilled workforce.

---

## 2. MVP Scope — What We Actually Build in 5 Days

### ✅ In scope (core, must-have)
| # | Feature | Why it's core |
|---|---|---|
| 1 | Worker registration + profile + skill tagging — via **self-registration OR assisted registration by a Field Coordinator** | Core entity; many target workers are rural/informal and won't self-register on a smartphone — see §5a |
| 2 | Admin/Federation verification of workers | Directly required by PS ("verified" is in the problem statement) |
| 3 | Customer booking flow (select service → date/time → address) | Core transaction |
| 4 | Geo/area-based worker matching | Explicit required feature; MongoDB native — no extra library |
| 5 | Booking status lifecycle (Requested → Assigned → In Progress → Completed) | Judges expect a working state machine, not just a form |
| 6 | Rating & feedback after completion | Explicit required feature, simple CRUD |
| 7 | Federation admin dashboard (workers, bookings, basic charts) | Explicit required feature; this is your "impressive visual" |
| 8 | "Demand insights" module (NOT real ML — see §5) | Satisfies "AI-based demand forecasting" honestly and cheaply |

### 🟡 Include if time allows (nice-to-have)
- Digital payments — use Razorpay **test mode** only, don't build real settlement logic
- Basic multilingual toggle (English/Hindi) on customer-facing pages — a JSON i18n file, not a translation service
- Emergency/on-demand booking flag (just a priority boolean + sort order)
- **SMS notification on booking assignment** (Twilio free trial is fast to wire up) — lets a worker without a smartphone still get notified of a job
- **Voice AI assistant (Hindi/English)** — see §5b; the standout feature, but scope it to 2 screens max, not the whole app

### ❌ Explicitly cut — do not attempt
- Real AI/ML model of any kind
- Native mobile app — responsive web only, mention "PWA-ready" in the pitch if asked
- Real insurance provider integration — model it as a data field + status, not a live integration
- Real payment settlement/payout logic to workers

---

## 3. Roles & Core Entities

**Roles:** Worker, Customer, Federation Admin, **Field Coordinator** (cooperative-society staff who can register/edit a worker's profile on that worker's behalf)

**Entities (MongoDB collections):**
- `User` — shared base (name, phone, role, password hash, location {lat, lng})
- `WorkerProfile` — userId ref, skills[], certifications[] (file URLs), verificationStatus (pending/verified/rejected), availability, ratingAvg
- `Booking` — customerId, workerId, serviceCategory, address, location, scheduledAt, status, isEmergency, price
- `Rating` — bookingId, customerId, workerId, stars, comment
- `Cooperative` (optional, only if time allows) — for multi-federation demo depth

---

## 4. Core User Flows (build in this order)

1. **Auth** — register/login for Worker & Customer, JWT, role-based middleware
2. **Worker onboarding** — profile + skill selection + certificate upload (multer, store locally or S3-mock)
3. **Admin verification** — admin dashboard lists pending workers, approve/reject action
4. **Customer booking** — pick service category → see matched nearby verified workers → book a slot
5. **Geo matching** — MongoDB `2dsphere` index + `$geoNear` or `$near` query, radius filter (e.g., 5km)
6. **Booking lifecycle** — worker accepts → status updates → mark complete
7. **Rating** — customer rates after completion → updates worker's `ratingAvg`
8. **Admin dashboard charts** — bookings/day, top service categories, verified vs pending workers (use `recharts` or `chart.js`)
9. **Demand insights module** — see §5

---

## 5. "AI-Based Demand Forecasting" — Do This Instead of ML

The PS lists this as a feature but you don't need Python/TensorFlow. Build it as an **aggregation-based insight**, and present it honestly as a statistical/rule-based approach (this is a legitimate, explainable alternative — say so directly to judges, don't pretend it's ML):

- Use a MongoDB aggregation pipeline on `Booking` data: group by `(area, serviceCategory, hourOfDay)` → count requests.
- Compute a simple **moving average** or **percentage share** per area/category (plain JS, `Array.reduce`/`Math` — no library needed).
- Flag areas/categories crossing a threshold as "High Demand" — display on the admin dashboard as a heatmap or ranked list.
- Frame it in the PPT as: *"Rule-based, explainable demand analytics — transparent to cooperative administrators, unlike a black-box model."*

This is fully doable in Node.js, ships on time, and gives you a legitimate answer to the "AI" line item in the PS.

---

## 5a. Assisted Registration — Why It's Necessary

Don't assume every worker (electricians, plumbers, domestic help, gardeners — often rural, often older, often with only a basic phone) can or will self-register on a smartphone app. India's own e-Shram portal (the national database for unorganised workers) hit this exact wall: over 80% of its registrations happened through Common Service Centre (CSC) operators registering workers on their behalf, not through workers self-registering. Labour rights researchers have flagged the same access gap — no smartphone, or discomfort using one — as a core barrier.

**Design response:** the `Field Coordinator` role (a cooperative-society staff member) can create and edit a worker's profile directly — in person, over a form, or over a phone call — so a worker never needs to own or operate a smartphone to be onboarded. This is not a workaround; it's the correct design for the actual population this PS is about, and it's worth stating explicitly to judges as a sign of ground-level research rather than a generic app-first assumption.

---

## 5b. Voice AI Assistant (Hindi/English) — The Standout Feature

This is API orchestration, not model training — fully buildable in plain Node.js, no Python required.

**Primary path — Bhashini (Govt of India / MeitY):**
1. Record audio in-browser (`MediaRecorder`)
2. Send to backend → call Bhashini ASR API (`dhruva-api.bhashini.gov.in`) → get Hindi/English text
3. Pass text to a small LLM call (OpenAI/Gemini free tier, one prompt, no fine-tuning) → extract structured intent, e.g. `{service, date, time}`
4. Create the booking via the existing Booking API
5. Call Bhashini TTS to speak the confirmation back

**Fallback path — Web Speech API (browser-native):**
- `SpeechRecognition` (STT) + `SpeechSynthesis` (TTS), both support `hi-IN`, zero registration, zero backend calls, works instantly in Chrome. Use this if Bhashini API-key approval doesn't come through in time — same demo outcome, less "sovereign-tech" pitch value but fully functional.

**Scope discipline:** wire this into 2 screens only — customer voice booking, and a simple FAQ/booking-status voice query. Don't try to voice-enable the whole app in the time available.

**Viability note for the pitch:** Bhashini is free for public/Digital-India use, so this doesn't add a recurring per-call cost burden for a cooperative-run platform — worth saying explicitly if judges ask about scaling cost.

---

## 6. Suggested Tech Stack

- **Backend:** Node.js + Express, MongoDB + Mongoose (with `2dsphere` index on location)
- **Auth:** JWT + bcrypt
- **File uploads:** Multer (local disk is fine for a demo)
- **Frontend:** React + plain CSS/Tailwind, `recharts` for dashboard charts
- **Payments (optional):** Razorpay test mode
- **Maps (optional, for polish):** Leaflet + OpenStreetMap (free, no API key hassle) to visually show worker locations on the admin dashboard

---

## 7. Day-Wise Plan (5 days: today → hackathon)

| Day | Focus |
|---|---|
| Day 1 (today) | Finalize schema, set up repo, auth (register/login both roles), basic project skeleton |
| Day 2 | Worker profile + skill/certificate upload, admin verification flow |
| Day 3 | Customer booking flow + geo-matching query, booking lifecycle |
| Day 4 | Rating system, admin dashboard + charts, demand-insights aggregation |
| Day 5 | Polish UI, responsive fixes, seed realistic demo data (don't use random/lorem data — use real-sounding Indian names, areas, service categories), rehearse demo flow end-to-end |

---

## 8. Pitch Narrative for PPT

1. **Problem** — cooperative workers exist, skilled, local, but invisible to digital-first customers; private platforms take a cut and dominate.
2. **Root cause** — no dedicated tech layer for cooperatives to reach customers directly.
3. **Solution** — this platform, cooperative-owned, worker-first.
4. **Why now** — tie directly to the Ministry of Cooperation's ongoing move to formalize skilled-worker cooperatives nationally (mention this — it shows you did real research, not just a generic Urban-Company clone).
5. **Differentiator** — fair-wage-by-design (no platform commission model), rule-based transparent demand analytics instead of a black-box model, cooperative federation admin controls, and **assisted registration** so the platform doesn't assume smartphone access — a lesson taken directly from e-Shram's real rollout experience.
6. **Demo** — walk through: worker registers → gets verified → customer books → geo-match happens → booking completes → rating given → admin dashboard shows the whole picture including demand insights.

---

## 9. Biggest Risks to Watch

- **Scope creep** — resist adding payment/insurance/mobile-app depth beyond what's listed as optional above. Every day spent there is a day not spent on the core flow being smooth.
- **Demo data** — a working system with 3 fake users looks weak; seed at least 15–20 workers and a realistic booking history so the geo-matching and demand-insights features have something to show.
- **"AI" question from judges** — be ready to explain clearly and confidently why you chose a rule-based approach over ML (time constraint + explainability), rather than looking like you skipped it.