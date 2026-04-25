# 🌿 AlignSetu

**India's AI-powered platform connecting NGOs, volunteers, and environmental drives — in one place.**

AlignSetu bridges the gap between environmental intent and real-world action. NGOs create and manage drives, Gemini AI structures and matches them to the right volunteers, and every outcome is tracked in real time.

---

## ✨ Features

- **Gemini AI Analysis** — Converts drive descriptions into structured action plans with urgency scoring and skill matching
- **Google Maps Integration** — Volunteers discover nearby drives on an interactive map with real-time markers
- **Smart Volunteer Matching** — AI matches volunteers to drives based on skills, location, and availability
- **NGO Verification** — Admin panel with AI-powered flagging ensures only legitimate NGOs operate
- **Real-time Analytics** — Live dashboards track environmental impact, volunteer hours, and drive completion rates
- **Multi-category Drives** — Cleanups, plantation, water conservation, wildlife protection, and awareness campaigns
- **Dark / Light Theme** — Full theme support across all pages

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Auth & DB | Firebase (Auth + Firestore) |
| AI | Google Gemini API |
| Maps | Google Maps API (`@googlemaps/react-wrapper`) |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Routing | React Router v7 |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/heyoaryan/AlignSetu.git
cd AlignSetu
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the dev server

```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── AIFinder.jsx
│   ├── AIResultPanel.jsx
│   ├── CreateDriveModal.jsx
│   ├── DriveCard.jsx
│   ├── DriveDetailModal.jsx
│   ├── DriveVerificationModal.jsx
│   ├── MapView.jsx
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   ├── StatCard.jsx
│   └── VolunteerCheckInModal.jsx
├── config/
│   └── firebase.js    # Firebase initialisation
├── context/
│   ├── AuthContext.jsx # Auth state & role management
│   └── ThemeContext.jsx
├── pages/
│   ├── Landing.jsx
│   ├── Auth.jsx
│   ├── NGODashboard.jsx
│   ├── VolunteerDashboard.jsx
│   └── AdminDashboard.jsx
├── services/
│   └── gemini.js      # Gemini AI integration
├── App.jsx
└── main.jsx
```

---

## 👥 User Roles

| Role | Access |
|---|---|
| **NGO** | Create & manage drives, view analytics, check in volunteers |
| **Volunteer** | Discover drives on map, join drives, track personal impact |
| **Admin** | Verify NGOs, monitor platform-wide stats, flag suspicious activity |

---

## 🌍 Drive Categories

- 🧹 Cleanup
- 🌳 Plantation
- 💧 Water Conservation
- ♻️ Recycling
- 🌬️ Awareness Campaigns
- 🦁 Wildlife Protection

---

## 📜 License

MIT © [Aryan Singh Thakur](https://github.com/heyoaryan)
