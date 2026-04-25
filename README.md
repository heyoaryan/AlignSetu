<div align="center">

<img src="public/leaf.svg" width="64" height="64" alt="AlignSetu Logo" />

# AlignSetu

### India's AI-Powered Environmental Volunteer Coordination Platform

**Built for Google Solution Challenge 2026**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-API-34A853?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## The Problem

India has thousands of NGOs running environmental drives — cleanups, plantation campaigns, water conservation efforts, wildlife protection — but they operate in complete isolation.

| Gap | Reality |
|---|---|
| 🔴 **No central platform** | NGOs coordinate via WhatsApp groups, spreadsheets, and emails |
| 🔴 **Volunteers go unmatched** | Willing volunteers have no way to discover nearby drives that fit their skills |
| 🔴 **Data is scattered** | Impact data is never aggregated — trees planted, waste cleared, hours contributed |
| 🔴 **No trust layer** | Fake or inactive NGOs waste volunteer time with zero accountability |
| 🔴 **Manual planning** | NGOs spend hours manually structuring drives, estimating volunteers, and assigning tasks |

The result: environmental intent exists, but action is fragmented and unmeasured.

---

## The Solution — AlignSetu

AlignSetu (meaning *"bridge of alignment"*) is a full-stack web platform that connects NGOs, volunteers, and administrators on one AI-powered system.

**Gemini AI** reads drive descriptions and converts them into structured action plans. **Google Maps** shows volunteers exactly where help is needed. **Firebase** keeps everything in sync in real time. Every drive, every volunteer hour, every outcome is tracked and measured.

> One platform. Three roles. Real environmental impact.

---

## How It Works

### For NGOs
```
1. Register & get verified by admin
2. Describe your drive in plain text
3. Gemini AI auto-generates: category, urgency score, required skills,
   estimated volunteers, duration, action items
4. Drive goes live on the map instantly
5. After the drive: upload photos + impact data → AI verifies within 8 hours
```

### For Volunteers
```
1. Sign up and build a profile (skills, availability, location, volunteer type)
2. Browse drives on an interactive Google Map or list view
3. Gemini AI recommends the best-fit drives based on your profile
4. Join a drive → earn XP, build streaks, unlock badges
5. Check in at the drive → submit photos + notes → get AI-generated thank-you
```

### For Admins
```
1. Review and verify NGO registrations
2. Monitor platform-wide stats: drives, volunteers, completion rates
3. AI flags suspicious/inactive NGOs automatically
4. View live activity map (drives layer + volunteers layer)
5. Get Gemini AI platform health insights and recommendations
```

---

## Key Features

### 🤖 Gemini AI — Core Intelligence Layer

| Feature | What it does |
|---|---|
| **Drive Analysis** | Converts a plain-text drive description into structured data: category, urgency (low/medium/high/critical), required skills, estimated volunteers, duration, impact score (1–10), summary, and action items |
| **Volunteer Matching** | Recommends top 3 drives for each volunteer based on skills, location, availability, and volunteer type — with match score and reason |
| **Personalized Nudges** | Generates motivating messages for volunteers based on their XP, streak, and activity |
| **Check-in Thank You** | Creates a warm, personalized thank-you after a volunteer submits photos and notes |
| **Community Needs Report** | Analyzes all active drives to surface the biggest local environmental needs, urgent areas, and a recommended action |
| **Admin Platform Insight** | Gives admins a one-sentence health summary, alert, and recommendation based on live platform stats |
| **NGO Flagging** | AI identifies suspicious or inactive NGOs for admin review |

### 🗺️ Google Maps Integration

- Interactive map showing all active drives as color-coded markers by category
- Volunteer location detection with adjustable radius filter (20–50 km)
- Category filter chips to show only relevant drive types
- Admin live map with two layers: NGO drives and volunteer locations
- Drive cards below the map update dynamically with the active filter

### 📊 Real-time Dashboards

**NGO Dashboard**
- Overview stats: total drives, active drives, volunteers joined, completed drives
- Volunteer engagement chart (monthly area chart)
- Impact metrics: trees planted, waste collected, area covered, lives impacted
- Drive management with search + filter (all / active / completed)
- 8-hour verification window with photo submission review
- AI Finder to match volunteers to a specific drive

**Volunteer Dashboard**
- Personal stats: drives joined, hours contributed, XP, streak
- AI nudge card with personalized motivation
- Profile builder: skills, volunteer type, availability, location, bio
- Gamification: XP system, streak tracking, 6 unlockable badges (Tree Planter, Eco Warrior, Skill Master, On Fire, Champion, Top Volunteer)
- AI-recommended drives with match scores
- Map view with radius and category filters
- Check-in modal: photo upload, notes, drive rating → AI thank-you message

**Admin Dashboard**
- Platform stats: total users, verified NGOs, total drives, pending verifications
- Weekly activity bar chart (drives + volunteers per day)
- Drive category pie chart
- Platform growth line chart (users + NGOs over 6 months)
- NGO verification queue: approve or reject with one click
- Flagged NGOs panel with severity levels (low / medium / high / critical)
- Live activity map with drives and volunteers layers

### 🔐 Authentication & Role System

- Firebase Auth with email/password
- Three roles: `ngo`, `volunteer`, `admin`
- Protected routes — each role sees only their dashboard
- NGOs require admin verification before going live

### 🎨 UI & Experience

- Full dark / light theme with smooth transitions
- Framer Motion animations throughout (page transitions, card hovers, counters)
- Animated typing effect on the landing hero
- Scroll-based parallax and fade on the hero section
- Responsive layout — works on mobile, tablet, and desktop
- React Hot Toast notifications for all actions

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite 8 | UI framework and build tool |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Auth & Database | Firebase Auth + Firestore | User auth and real-time data |
| AI | Google Gemini 2.0 Flash | Drive analysis, matching, insights |
| Maps | Google Maps API | Interactive drive discovery map |
| Charts | Recharts | Analytics dashboards |
| Icons | Lucide React | Consistent icon system |
| Notifications | React Hot Toast | In-app feedback |
| Routing | React Router v7 | Client-side navigation |

---

## UN Sustainable Development Goals

AlignSetu directly addresses:

- **SDG 13 — Climate Action**: Coordinates environmental drives that reduce pollution and restore ecosystems
- **SDG 15 — Life on Land**: Supports plantation, wildlife protection, and land restoration drives
- **SDG 6 — Clean Water**: Enables water conservation and lake/river restoration campaigns
- **SDG 17 — Partnerships for the Goals**: Bridges NGOs, volunteers, and communities on one platform

---

## Project Structure

```
src/
├── components/
│   ├── AIFinder.jsx          # Gemini-powered volunteer finder for NGOs
│   ├── AIResultPanel.jsx     # Displays AI analysis results
│   ├── CreateDriveModal.jsx  # Drive creation form with AI analysis
│   ├── DriveCard.jsx         # Drive summary card
│   ├── DriveDetailModal.jsx  # Full drive detail with tabs
│   ├── DriveVerificationModal.jsx  # 8-hour post-drive verification
│   ├── MapView.jsx           # Google Maps component with markers
│   ├── Navbar.jsx            # Landing page navigation
│   ├── Sidebar.jsx           # Dashboard sidebar (all roles)
│   ├── StatCard.jsx          # Reusable stat display card
│   └── VolunteerCheckInModal.jsx   # Check-in with photo + AI thank-you
│
├── config/
│   └── firebase.js           # Firebase init + mock Firestore for demo
│
├── context/
│   ├── AuthContext.jsx       # Auth state, user role management
│   └── ThemeContext.jsx      # Dark/light theme state
│
├── pages/
│   ├── Landing.jsx           # Public landing page
│   ├── Auth.jsx              # Login / signup with role selection
│   ├── NGODashboard.jsx      # NGO role dashboard
│   ├── VolunteerDashboard.jsx # Volunteer role dashboard
│   └── AdminDashboard.jsx    # Admin role dashboard
│
├── services/
│   └── gemini.js             # All Gemini AI API calls
│
├── App.jsx                   # Routes + protected route logic
└── main.jsx                  # App entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google account for Firebase and API keys

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

```bash
cp .env.example .env
```

Fill in your keys in `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> **Note:** The app ships with a full mock Firestore implementation. You can run and demo all features without a real Firebase project — just leave the Firebase keys as-is and the mock data will load automatically.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Try the demo

The app seeds 5 real drives on first load (Yamuna River Cleanup, Lodhi Garden Plantation, etc.). Sign up with any email and select a role to explore each dashboard.

| Role | What to try |
|---|---|
| **Volunteer** | Browse drives on the map, join a drive, earn XP, check in with photos |
| **NGO** | Create a drive (watch Gemini analyze it), verify a completed drive |
| **Admin** | Verify an NGO, view the live map, read the AI platform insight |

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Firebase Hosting, Vercel, or Netlify.

---

## Roadmap

- [ ] Push notifications for drive reminders
- [ ] NGO profile pages with public drive history
- [ ] Volunteer leaderboard by city/region
- [ ] Drive scheduling with calendar integration
- [ ] WhatsApp bot for drive updates
- [ ] Multi-language support (Hindi, Tamil, Bengali)
- [ ] Carbon offset calculator per drive

---

## Team

Built with ❤️ for **Google Solution Challenge 2026**

**Aryan Singh Thakur** — [github.com/heyoaryan](https://github.com/heyoaryan)

---

<div align="center">

*AlignSetu — Bridging the gap between environmental intent and real-world action.*

</div>
