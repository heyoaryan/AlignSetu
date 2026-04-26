<div align="center">

<img src="public/leaf.svg" width="72" height="72" alt="AlignSetu Logo" />

# AlignSetu

### India's AI-Powered Environmental Volunteer Coordination Platform

**Built for Google Solution Challenge 2026**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-alignsetu.web.app-4285F4?style=flat-square&logo=firebase)](https://alignsetu.web.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-API-34A853?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Firebase](https://img.shields.io/badge/Deployed%20on-Google%20Cloud%20%2F%20Firebase%20Hosting-FF6F00?style=flat-square&logo=googlecloud)](https://alignsetu.web.app)

</div>

---

## 🌍 The Problem

India has thousands of NGOs running environmental drives — cleanups, plantation campaigns, water conservation efforts, wildlife protection — but they operate in complete isolation.

| Gap | Reality |
|---|---|
| 🔴 **No central platform** | NGOs coordinate via WhatsApp groups, spreadsheets, and emails |
| 🔴 **Volunteers go unmatched** | Willing volunteers have no way to discover nearby drives that fit their skills |
| 🔴 **Data is scattered** | Impact data is never aggregated — trees planted, waste cleared, hours contributed |
| 🔴 **No trust layer** | Fake or inactive NGOs waste volunteer time with zero accountability |
| 🔴 **Manual planning** | NGOs spend hours manually structuring drives, estimating volunteers, and assigning tasks |
| 🔴 **Community voice ignored** | Local residents have no easy way to report environmental issues to NGOs |

The result: environmental intent exists, but action is fragmented and unmeasured.

---

## ✅ The Solution — AlignSetu

AlignSetu (meaning *"bridge of alignment"*) is a full-stack web platform that connects NGOs, volunteers, administrators, and local communities on one AI-powered system.

**Gemini AI** reads drive descriptions and converts them into structured action plans. **Google Maps** shows volunteers exactly where help is needed. **Firebase** keeps everything in sync in real time. Every drive, every volunteer hour, every outcome is tracked and measured.

> One platform. Three roles. Real environmental impact.

🔗 **Live at:** [https://alignsetu.web.app](https://alignsetu.web.app) — Deployed on **Google Cloud (Firebase Hosting)**

---

## 🚀 How It Works

### For NGOs
```
1. Register & get verified by admin
2. Describe your drive in plain text
3. Gemini AI auto-generates: category, urgency score, required skills,
   estimated volunteers, duration, action items, impact score
4. Drive goes live on the map instantly
5. Generate a QR code poster for community intake
6. After the drive: upload photos + impact data → AI verifies and generates report
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

### For the Community (Public)
```
1. Scan a QR code posted by an NGO in your area
2. Report an environmental issue via form or voice (Hindi/English)
3. Upload a photo — AI analyzes urgency and matches to existing drives
4. Or call the NGO directly from the intake page
```

---

## ✨ Key Features

### 🤖 Gemini AI — Core Intelligence Layer (9 AI Features)

| Feature | What it does |
|---|---|
| **Drive Analysis** | Converts plain-text drive description into structured data: category, urgency, required skills, estimated volunteers, duration, impact score (1–10), summary, and action items |
| **Volunteer Matching** | Recommends top drives for each volunteer based on skills, location, availability, and volunteer type — with match score and reason |
| **AI Volunteer Finder** | NGOs can search for best-fit volunteers for a specific drive using voice or text — Gemini ranks and explains matches |
| **Personalized Nudges** | Generates motivating messages for volunteers based on their XP, streak, and activity history |
| **Check-in Thank You** | Creates a warm, personalized thank-you after a volunteer submits photos and notes |
| **Community Needs Report** | Analyzes all active drives to surface the biggest local environmental needs, urgent areas, and a recommended action |
| **Admin Platform Insight** | Gives admins a health summary, alert, and recommendation based on live platform stats |
| **NGO Flagging** | AI identifies suspicious or inactive NGOs for admin review |
| **Photo Vision Analysis** | Analyzes photos submitted via public QR intake to assess urgency and match to existing drives |

---

### 🗺️ Google Maps Integration

- Interactive map showing all active drives as color-coded markers by category
- Volunteer GPS location detection with adjustable radius filter (20–50 km)
- Category filter chips to show only relevant drive types
- Admin live map with two layers: NGO drives and volunteer locations
- Drive info windows with one-tap Google Maps directions
- Reverse geocoding for human-readable location names
- Dark map style in dark mode

---

### 📋 Public QR Intake System

- NGOs generate a branded QR code poster (bilingual — Hindi & English)
- Community members scan the QR to report environmental issues
- **Form mode**: category selector, voice/text description, GPS location, urgency level, photo upload
- **Call mode**: direct phone call to NGO with SMS follow-up option
- AI Vision analyzes submitted photos and auto-adjusts urgency
- Submitted needs appear in the NGO's Public Needs panel for action
- Poster download with NGO branding, QR code, and helpline number

---

### 🎮 Gamification System

- **XP System**: Earn 50 XP per drive joined, 25 XP streak bonus
- **Daily Streak Tracking**: Consecutive day activity tracking
- **6 Unlockable Badges** with progress bars:
  - 🌳 Tree Planter — Join 3+ plantation drives
  - 🏆 Eco Warrior — Join 5+ drives
  - 🎯 Skill Master — List 5+ skills
  - 🔥 On Fire — Maintain a 3-day streak
  - 👑 Champion — Earn 500+ XP
  - ⭐ Top Volunteer — Join 10+ drives

---

### 📊 Real-time Dashboards

**NGO Dashboard**
- Stats: Total Drives, People Helped, Volunteers Joined, Completed Drives
- Volunteer engagement area chart (monthly trend)
- Impact metrics: Trees Planted, Waste Collected, Area Covered, Lives Impacted
- Drive management with search + filter (all / active / completed)
- 8-hour post-drive verification window with photo submission
- AI Finder to match volunteers to a specific drive
- Public Needs panel with QR intake management
- Analytics: weekly activity, category breakdown, growth trends

**Volunteer Dashboard**
- Stats: Drives Joined, Hours Contributed, XP, Current Streak
- AI nudge card with personalized motivation
- Profile builder: skills (14 options), volunteer type (7 types), availability (6 options), location, bio
- Gamification: XP system, streak tracking, 6 unlockable badges
- AI-recommended drives with match scores
- Map view with radius and category filters
- My Drives history with full detail modal
- Check-in modal: photo upload (up to 5), notes, star rating → AI thank-you message

**Admin Dashboard**
- Stats: Total Users, Verified NGOs, Total Drives, Pending Verifications
- Alert banner for pending NGO verifications
- AI Platform Insight: health summary, alerts, recommendations
- Weekly activity bar chart (drives + volunteers per day)
- Drive category pie chart
- Platform growth line chart (users + NGOs over 6 months)
- NGO verification queue: approve or reject with one click
- Flagged NGOs panel with severity levels (low / medium / high / critical)
- Live activity map with drives and volunteers layers

---

### 🔐 Authentication & Role System

- Firebase Auth with email/password
- Google OAuth (social login)
- Three roles: `ngo`, `volunteer`, `admin`
- Protected routes — each role sees only their dashboard
- NGOs require admin verification before going live
- Session persistence across page reloads

---

### 🎨 UI & Experience

- Full dark / light theme with smooth transitions and localStorage persistence
- Framer Motion animations throughout (page transitions, card hovers, animated counters)
- Animated typing effect on the landing hero
- Scroll-based parallax and fade on the hero section
- Floating particle animations on landing
- Bilingual interface (Hindi + English) throughout
- Voice input support for accessibility (Hindi/English language selection)
- Responsive layout — works on mobile, tablet, and desktop
- React Hot Toast notifications for all actions
- Animated stat counters with IntersectionObserver

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 + Vite 8 | UI framework and build tool |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Auth & Database | Firebase Auth + Firestore | User auth and real-time data |
| AI | Google Gemini 2.0 Flash | Drive analysis, matching, insights, vision |
| Maps | Google Maps API | Interactive drive discovery map |
| Charts | Recharts | Analytics dashboards |
| Icons | Lucide React | Consistent icon system |
| Notifications | React Hot Toast | In-app feedback |
| Routing | React Router v7 | Client-side navigation |
| Hosting | Firebase Hosting (Google Cloud) | Production deployment |

---

## 🌱 UN Sustainable Development Goals

AlignSetu directly addresses:

- **SDG 13 — Climate Action**: Coordinates environmental drives that reduce pollution and restore ecosystems
- **SDG 15 — Life on Land**: Supports plantation, wildlife protection, and land restoration drives
- **SDG 6 — Clean Water**: Enables water conservation and lake/river restoration campaigns
- **SDG 17 — Partnerships for the Goals**: Bridges NGOs, volunteers, and communities on one platform

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AIFinder.jsx              # Gemini-powered volunteer finder for NGOs (voice + text)
│   ├── AIResultPanel.jsx         # Displays AI drive analysis results
│   ├── CreateDriveModal.jsx      # 3-step drive creation with AI analysis
│   ├── DriveCard.jsx             # Drive summary card with countdown timer
│   ├── DriveDetailModal.jsx      # Full drive detail with tabs (Details, Updates, Map)
│   ├── DriveVerificationModal.jsx # 8-hour post-drive verification with photo upload
│   ├── MapView.jsx               # Google Maps component with markers and filters
│   ├── Navbar.jsx                # Landing page navigation with theme toggle
│   ├── PublicNeedsPanel.jsx      # QR intake management panel for NGOs
│   ├── QRIntakeModal.jsx         # QR code poster generator and downloader
│   ├── Sidebar.jsx               # Dashboard sidebar (all roles) with mobile drawer
│   ├── StatCard.jsx              # Reusable animated stat display card
│   └── VolunteerCheckInModal.jsx # Check-in with photo upload + AI thank-you
│
├── config/
│   └── firebase.js               # Firebase init + mock Firestore for demo
│
├── context/
│   ├── AuthContext.jsx           # Auth state, user role management
│   └── ThemeContext.jsx          # Dark/light theme state with persistence
│
├── pages/
│   ├── Landing.jsx               # Public landing page with animations
│   ├── Auth.jsx                  # Login / signup with role selection + Google OAuth
│   ├── NGODashboard.jsx          # NGO role dashboard (7 sections)
│   ├── VolunteerDashboard.jsx    # Volunteer role dashboard (5 sections)
│   ├── AdminDashboard.jsx        # Admin role dashboard (6 sections)
│   └── PublicIntake.jsx          # QR-based public community intake form
│
├── services/
│   └── gemini.js                 # All Gemini AI API calls (9 functions)
│
├── App.jsx                       # Routes + protected route logic
└── main.jsx                      # App entry point
```

---

## ⚡ Getting Started

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

The app seeds real drives on first load (Yamuna River Cleanup, Lodhi Garden Plantation, Community Food Drive, Free Health Camp, and more). Sign up with any email and select a role to explore each dashboard.

| Role | What to try |
|---|---|
| **Volunteer** | Browse drives on the map, join a drive, earn XP, check in with photos, unlock badges |
| **NGO** | Create a drive (watch Gemini analyze it), generate a QR poster, verify a completed drive, use AI Finder |
| **Admin** | Verify an NGO, view the live map, read the AI platform insight, review flagged NGOs |
| **Public** | Visit `/intake/:ngoId` to try the community QR intake form with voice input |

---

## 🏗️ Build & Deploy

### Build for Production

```bash
npm run build
```

Output goes to `dist/`.

### Deploy to Firebase Hosting (Google Cloud)

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

Live at: **[https://alignsetu.web.app](https://alignsetu.web.app)**

---

## 🗺️ Roadmap

- [ ] Push notifications for drive reminders
- [ ] NGO profile pages with public drive history
- [ ] Volunteer leaderboard by city/region
- [ ] Drive scheduling with calendar integration
- [ ] WhatsApp bot for drive updates
- [ ] Multi-language support (Hindi, Tamil, Bengali)
- [ ] Carbon offset calculator per drive
- [ ] Offline support with PWA

---

## 👤 Team

Built with ❤️ for **Google Solution Challenge 2026**

**Aryan Singh Thakur** — [github.com/heyoaryan](https://github.com/heyoaryan)

---

<div align="center">

*AlignSetu — Bridging the gap between environmental intent and real-world action.*

🌐 **[alignsetu.web.app](https://alignsetu.web.app)**

</div>
