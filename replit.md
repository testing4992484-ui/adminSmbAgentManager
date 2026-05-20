# Sabka Masti Bazaar — Admin Panel

## Project Overview
Yeh "Sabka Masti Bazaar" PWA game ka admin panel hai. React + Vite + Firebase se bana hai.
Same Firebase project use karta hai jo user app use karta hai.

## Tech Stack
- React 18 + Vite 5
- Firebase (Auth + Realtime Database)
- Recharts (graphs)
- Lucide React (icons)
- React Router DOM v6

## Access
- Admin Panel: `/admin` ya `/admin/login`
- Sirf authorized admins hi access kar sakte hain

## Firebase Setup
Firebase config `src/config/firebase.js` mein hai.

## Admin Setup (ZARURI)
1. Firebase Console > Authentication > Users > Apni email dhundho > UID copy karo
2. Firebase Realtime Database mein: `/admins/{YOUR_UID}` = `true` add karo
3. Bas! Ab tum admin ban gaye.

## Run karna
```bash
npm run dev
```
Port 5000 pe chalega.

## Folder Structure
- `src/admin/` — Admin panel ka poora code
  - `pages/` — 14 admin pages
  - `components/` — Reusable components
  - `hooks/` — Firebase data hooks
  - `context/` — Admin auth context
  - `utils/` — Helper functions

## User Preferences
- Hinglish mein communicate karo
- Dark neon color theme: purple + pink + gold + cyan on deep dark background
- Same Firebase project use karo user app ke saath
