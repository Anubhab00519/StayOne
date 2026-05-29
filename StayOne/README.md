# StayOne 🏨

> **AI-Powered Unified Hotel Management System**  
> Built for Hotel Grand Kolkata Inn, 14 Park Street, Kolkata 700016

StayOne is a hackathon demo that unifies WhatsApp AI booking, OTA channel management, and real-time clash detection in a single owner dashboard.

---

## ✨ Features

- **AI WhatsApp Bot** — Groq LLaMA-3.3-70b handles guest inquiries and autonomously creates bookings
- **Real-Time Clash Detection** — Prevents double bookings across all channels
- **Live Owner Dashboard** — Firebase real-time listeners update room status and booking feed in <1 second
- **OTA Simulator** — Demo tool to trigger dramatic conflict events (MakeMyTrip, Goibibo, Booking.com)
- **Walk-in Booking** — Direct hotel staff form with instant confirmation

---

## 📁 Project Structure

```
stayone/
  frontend/         React + Tailwind dashboard
  backend/          FastAPI + Groq + Firebase
  .env              Environment variables (fill in yours)
  .env.example      Public template
  README.md
```

---

## 🚀 Setup Instructions

### 1. Clone & configure environment

```bash
cd StayOne
cp .env.example .env
# Fill in your credentials in .env (see sections below)
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8000
```

The backend will seed hotel and room data to Firebase on first start.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Firestore Database** (start in production mode)
3. **Frontend credentials** (Client SDK):
   - Go to Project Settings → General → Your Apps → Add Web App
   - Copy the `firebaseConfig` values into `.env`:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     ```
4. **Backend credentials** (Admin SDK):
   - Project Settings → Service Accounts → Generate new private key
   - Open the downloaded JSON and copy values into `.env`:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@...
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
     ```
5. **Firestore Rules** (for demo — allow all):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

---

## 🤖 Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in → API Keys → Create API Key
3. Add to `.env`:
   ```
   GROQ_API_KEY=gsk_...
   ```

---

## 📱 WhatsApp Cloud API Setup

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an App → Business → Add WhatsApp product
3. In **WhatsApp → Getting Started**:
   - Note your **Phone Number ID** and **Temporary Access Token**
   - Add to `.env`:
     ```
     WHATSAPP_TOKEN=EAAxxxx...
     PHONE_NUMBER_ID=12345678901234
     VERIFY_TOKEN=stayone_verify_2024
     ```
4. Add a test recipient phone number in the "To" field

---

## 🌐 ngrok for WhatsApp Webhook

WhatsApp requires a public HTTPS URL for webhook delivery.

```bash
# Install ngrok from https://ngrok.com/download
ngrok http 8000
```

Copy the `https://xxxx.ngrok.io` URL and set it as your webhook in Meta Developers:
- **Webhook URL**: `https://xxxx.ngrok.io/whatsapp/webhook`
- **Verify Token**: `stayone_verify_2024`
- **Subscribe to**: `messages`

---

## 🎬 Demo Script (3 Key Moments)

### Moment 1: Walk-in Booking
1. Open dashboard at `http://localhost:5173`
2. All 5 rooms show **green (Available)**
3. Fill in the **"Add Walk-in Booking"** form:
   - Guest: Rahul Sharma, Phone: +91 98765 43210
   - Room: 101, Dates: today → tomorrow
4. Click **"Confirm Booking"**
5. **Watch**: Room 101 turns **red** in <1 second, booking appears in feed, notification fires

### Moment 2: OTA Clash Detection
1. Room 101 is now booked from Moment 1
2. In the **OTA Booking Simulator**:
   - Platform: **MakeMyTrip**
   - Room: **101** (same room)
   - Dates: same as above
3. Click **"Simulate OTA Booking"**
4. **Watch the sequence**:
   - 🔴 Room 101 card **flashes red 3 times**
   - 🚨 Red banner slides from top: *"Booking Conflict Blocked — MakeMyTrip attempted to book Room 101 — Automatically Rejected"*
   - 📋 New entry in booking feed with **"Conflict Blocked"** red badge
   - 🔔 Alert panel shows conflict notification
   - ✅ Room 101 stays **red** (original booking intact, OTA rejected)

### Moment 3: WhatsApp AI Bot (requires credentials)
1. Send a WhatsApp message to your test number: *"Hi, I want to book a deluxe room for 2 nights"*
2. **Watch**: AI responds with room options and asks for dates
3. Provide dates → AI creates booking autonomously
4. Dashboard updates in real time, confirmation sent back via WhatsApp

---

## 🔧 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings/create` | Create a new booking with clash detection |
| POST | `/bookings/ota-simulate` | Simulate OTA webhook booking |
| GET | `/whatsapp/webhook` | Meta verification challenge |
| POST | `/whatsapp/webhook` | Inbound WhatsApp messages → AI agent |
| GET | `/dashboard/stats` | Aggregated stats for dashboard |
| POST | `/rooms/block` | Block a room for maintenance |
| GET | `/` | Health check |

Interactive API docs: **http://localhost:8000/docs**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Vite |
| Backend | Python + FastAPI |
| Database | Firebase Firestore (real-time) |
| AI | Groq API — llama-3.3-70b-versatile |
| WhatsApp | Meta WhatsApp Cloud API |
| Hosting | Local + ngrok tunnel |

---

*Built for hackathon demo — Hotel Grand Kolkata Inn, Kolkata*
