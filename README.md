# Smart City Crowd System (CrowdAi)

AI-powered smart crowd management: real-time monitoring, chaos prediction, and enhanced security.

## Stack

- **Frontend:** Vite + React (TypeScript) + Tailwind CSS
- **Backend:** Flask, OpenCV, YOLOv8 (for crowd detection)
- **Database:** PostgreSQL
- **Alerts:** Twilio (SMS & WhatsApp)

## Roles

- **Super Admin** – full system access
- **Zone Admin** – zone-based management
- **Registered User** – logged-in user
- **Guest** – unauthenticated

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). UI uses the purple theme from the CrowdAi design (header `#4F1D7C`, body `#F0ECF9`, accent `#5C3295`).

### Backend

1. Create a PostgreSQL database (e.g. `crowdai`).
2. Copy `backend/.env.example` to `backend/.env` and set:
   - `DATABASE_URL`
   - Twilio keys for SMS/WhatsApp OTP and alerts
3. Install and run:

```bash
cd backend
pip install -r requirements.txt
python run.py
```

API runs at [http://localhost:5000](http://localhost:5000). Vite proxies `/api` to the backend.

### Auth (demo without backend)

- **Sign In** / **Register** in the header open a modal.
- **Register:** name, mobile (10 digits), then OTP. Demo OTP: `123456`.
- **Login:** mobile + OTP (`123456` for existing users when backend is not used).
- Dashboard is protected; unauthenticated users are redirected to home and the login modal is shown.

## Project Structure

```
Smart_City/
├── frontend/           # Vite + React + Tailwind
│   └── src/
│       ├── components/ # Header, Footer, AuthModal, ProtectedRoute
│       ├── contexts/   # AuthContext (user, roles, login/register/OTP)
│       ├── pages/      # Home, Dashboard, Alerts, Events
│       └── types/      # User, UserRole
├── backend/            # Flask API
│   ├── app/
│   │   ├── routes/     # auth (send-otp, login, register), alerts (SMS/WhatsApp)
│   │   ├── services/   # Twilio (send_sms_otp, send_whatsapp_alert)
│   │   └── db.py       # PostgreSQL (users, otp_codes)
│   └── run.py
└── README.md
```

## Next Steps

- Add YOLOv8 + OpenCV crowd detection pipeline and expose via Flask.
- Restrict Dashboard/Alerts/Events by role (e.g. super_admin, zone_admin).
- Store and manage zones for zone-based admins.
- Trigger Twilio SMS/WhatsApp alerts from crowd events.
