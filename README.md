# Home Electric Services

Production-oriented full-stack web app for Home Electric Services in Tuni, owned by M Dileep Kumar, for customer bookings, worker job handling, and admin platform management.

Built for:
- `client/`: React + Vite + Tailwind + Framer Motion, deployable to Vercel.
- `server/`: Express + Firebase Admin, deployable to Render.

## Local Setup

```bash
cd client
npm install
npm run dev
```

```bash
cd server
npm install
npm run dev
```

Copy `client/.env.example` to `client/.env` and `server/.env.example` to `server/.env`, then set Firebase, ImgBB, UPI, Anthropic, and deployment URLs. Authentication is Firebase-only.

Primary contact number: `+91 9493745479`.
Build credit: `WayzenTech 9398724704`.

## Key Features

- User panel: booking flow, coupons, direct UPI QR payment, screenshot/UTR verification, receipts, PDF export, profile and booking history.
- Worker panel: assigned jobs, status updates, WebP image compression, ImgBB upload integration, history charts, notifications.
- Admin panel: bookings, workers, services, coupons, banners, analytics, notifications, settings and AI service description endpoint.
- SEO/PWA: Helmet metadata, sitemap, robots, structured data, lazy images, Vite PWA service worker.
- Backend: token middleware, admin middleware, booking completion coupon automation, notifications and chatbot route.

## Deployment

Client on Vercel:

```bash
cd client
npm run build
```

Set all `VITE_*` variables in Vercel.

Server on Render:

```bash
cd server
npm start
```

Set all server env vars in Render. Recommended Render settings:
- Build command: `npm install`
- Start command: `node server.js`

## Firebase

Enable Authentication providers:
- Email/Password
- Google, for customers only

Enable:
- Firestore
- Storage
- FCM

Use `firestore.rules` and `storage.rules` as the starting rules. Run `server/scripts/seedFirestore.js` after server env vars are configured to preload categories, services and settings.
