<div align="center">

<img src="public/leaf.svg" width="64" height="64" alt="AlignSetu" />

# AlignSetu

India's environmental volunteer coordination platform, built for the Google Solution Challenge 2026.

[![Live](https://img.shields.io/badge/Live-alignsetu.web.app-4285F4?style=flat-square&logo=firebase)](https://alignsetu.web.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-API-34A853?style=flat-square&logo=googlemaps)](https://developers.google.com/maps)
[![Deployed on Google Cloud](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-FF6F00?style=flat-square&logo=googlecloud)](https://alignsetu.web.app)

</div>

---

## What is this

India has thousands of NGOs running cleanups, plantation drives, health camps, and awareness campaigns — but most of them work in silos. Volunteers don't know where to show up. Impact data never gets collected. Fake NGOs waste everyone's time. And local residents have no way to report issues to the people who can actually fix them.

AlignSetu (meaning "bridge of alignment") tries to fix that. It's a full-stack platform where NGOs post drives, volunteers find and join them, admins keep things accountable, and community members can report local issues by scanning a QR code. Gemini AI sits at the center of it — analyzing drives, matching volunteers, flagging bad actors, and generating insights.

Live at **[alignsetu.web.app](https://alignsetu.web.app)** — deployed on Google Cloud via Firebase Hosting.

---

## The three roles

**NGO** — Register, get verified by an admin, then start posting drives. You describe the drive in plain text and Gemini figures out the category, urgency, required skills, estimated volunteer count, and action items automatically. Once a drive is done, you submit photos and impact data through an 8-hour verification window and get an AI-generated impact report. You can also generate a QR code poster to put up in your area so locals can report issues directly to you.

**Volunteer** — Sign up, build a profile with your skills and availability, and browse drives on a Google Map or list view. Gemini recommends the best drives for you based on your profile. Join drives to earn XP, build streaks, and unlock badges. After attending, check in with photos and notes and get a personalized thank-you from the AI.

**Admin** — Verify NGO registrations, monitor platform stats, review AI-flagged suspicious NGOs, and get a one-sentence platform health insight from Gemini. There's a live map showing all active drives and volunteer locations.

---

## Features

### Gemini AI (9 integrations)

The whole AI layer lives in `src/services/gemini.js`. Here's what it does:

- **Drive analysis** — takes a plain-text description and returns category, urgency level, required skills, estimated volunteers, duration, impact score out of 10, a two-sentence summary, and 3-5 action items
- **Volunteer matching** — recommends the best drives for a volunteer based on their skills, location, availability, and volunteer type, with a match score and reason for each
- **AI Volunteer Finder** — NGOs can type or speak a query and Gemini finds the best-fit volunteers for a specific drive, ranked with explanations
- **Personalized nudges** — generates a motivating message for each volunteer based on their XP, streak, and recent activity
- **Check-in thank you** — after a volunteer submits photos and notes, Gemini writes them a warm personalized thank-you
- **Community needs report** — analyzes all active drives on the platform and surfaces the biggest local needs and a recommended action
- **Admin platform insight** — gives admins a health summary, an alert if something looks off, and a recommendation
- **NGO flagging** — identifies suspicious or inactive NGOs automatically for admin review
- **Photo vision analysis** — when someone submits a photo through the public QR intake form, Gemini analyzes it to assess urgency and match it to existing drives

### Google Maps

Every active drive shows up as a color-coded marker on the map, grouped by category. Volunteers can turn on GPS to see drives within a radius they set (20 to 50 km). There are category filter toggles, info windows with drive details, and a one-tap button to open Google Maps directions. The admin map has two layers — drives and volunteer locations. Dark mode switches the map style automatically.

### Public QR Intake

NGOs can generate a branded poster with a QR code embedded. Anyone who scans it lands on a bilingual (Hindi and English) intake page where they can report an environmental issue. They can describe the problem by typing or speaking, attach a photo, share their GPS location, and set an urgency level. There's also a call mode if they'd rather just phone the NGO directly. Submitted reports show up in the NGO's Public Needs panel, where the NGO can review them, update their status, and see the AI's analysis of the photo and suggested matching drives.

### Gamification

Volunteers earn 50 XP every time they join a drive and a 25 XP bonus for maintaining a streak. There are six badges to unlock:

- Tree Planter (join 3 plantation drives)
- Eco Warrior (join 5 drives)
- Skill Master (add 5 or more skills to your profile)
- On Fire (3-day streak)
- Champion (reach 500 XP)
- Top Volunteer (join 10 drives)

Each badge shows a progress bar so you know how close you are.

### Dashboards

The NGO dashboard has sections for overview stats, drive management, post-drive verification, public needs, AI Finder, analytics, and settings. The volunteer dashboard covers overview, map view, drive browsing, drive history, and profile. The admin dashboard has overview, NGO verification, flagged NGOs, live map, analytics, and settings. All three update in real time via Firestore listeners.

### Auth

Firebase Auth handles email/password login and Google OAuth. There are three roles — ngo, volunteer, admin — and each one gets routed to its own dashboard. NGOs can't go live until an admin verifies them. Sessions persist across reloads.

### UI

Dark and light mode with smooth transitions, stored in localStorage. Framer Motion animations on page transitions, card hovers, and stat counters. Animated typing effect on the landing hero. Scroll-based parallax on the hero section. Floating particles in the background. The whole interface is bilingual — Hindi and English side by side in forms and labels. Voice input works in both languages. Fully responsive on mobile, tablet, and desktop.

---

## Tech stack

| | |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Auth and database | Firebase Auth + Firestore |
| AI | Google Gemini 2.0 Flash |
| Maps | Google Maps API |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Routing | React Router v7 |
| Hosting | Firebase Hosting on Google Cloud |

---

## SDGs addressed

- SDG 13 (Climate Action) — coordinates drives that reduce pollution and restore ecosystems
- SDG 15 (Life on Land) — supports plantation, wildlife protection, and land restoration
- SDG 6 (Clean Water) — enables water conservation and river restoration campaigns
- SDG 17 (Partnerships for the Goals) — connects NGOs, volunteers, and communities on one platform

---

## Project structure

```
src
  components
    AIFinder.jsx              voice and text volunteer search powered by Gemini
    AIResultPanel.jsx         shows the AI analysis after a drive is described
    CreateDriveModal.jsx      3-step drive creation flow with AI analysis built in
    DriveCard.jsx             drive summary card with countdown and volunteer progress
    DriveDetailModal.jsx      full drive view with Details, Updates, and Map tabs
    DriveVerificationModal.jsx  post-drive photo upload and impact submission
    MapView.jsx               Google Maps with markers, filters, and radius circle
    Navbar.jsx                landing page nav with theme toggle
    PublicNeedsPanel.jsx      NGO panel for managing QR intake submissions
    QRIntakeModal.jsx         QR poster generator with download and share
    Sidebar.jsx               dashboard sidebar for all three roles
    StatCard.jsx              animated stat counter card
    VolunteerCheckInModal.jsx  check-in with photos, notes, rating, and AI thank-you
  config
    firebase.js               Firebase setup and mock Firestore for demo mode
  context
    AuthContext.jsx           auth state and role management
    ThemeContext.jsx          dark/light theme with localStorage
  pages
    Landing.jsx               public landing page
    Auth.jsx                  login and signup with role selection
    NGODashboard.jsx          full NGO dashboard
    VolunteerDashboard.jsx    full volunteer dashboard
    AdminDashboard.jsx        full admin dashboard
    PublicIntake.jsx          QR intake form for community members
  services
    gemini.js                 all 9 Gemini API calls
  App.jsx                     routes and protected route logic
  main.jsx                    entry point
```

---

## Running locally

You need Node 18 or higher.

```bash
git clone https://github.com/heyoaryan/AlignSetu.git
cd AlignSetu
npm install
cp .env.example .env
```

Fill in `.env` with your keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GEMINI_API_KEY=
```

The app has a full mock Firestore implementation so you can run it without real Firebase keys. Mock drives load automatically on first visit.

```bash
npm run dev
```

Opens at http://localhost:5173. Sign up with any email and pick a role to explore. There are pre-seeded drives (Yamuna River Cleanup, Lodhi Garden Plantation, Community Food Drive, Free Health Camp) so the map and dashboards aren't empty.

---

## Deploying

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase deploy
```

---

## What's next

- Push notifications for drive reminders
- NGO public profile pages
- Volunteer leaderboard by city
- Calendar integration for drive scheduling
- WhatsApp bot for updates
- Hindi, Tamil, Bengali language support
- Carbon offset calculator
- PWA with offline support

---

Built by **Aryan Singh Thakur** for Google Solution Challenge 2026.  
[github.com/heyoaryan](https://github.com/heyoaryan) · [alignsetu.web.app](https://alignsetu.web.app)
