# Natours (TypeScript / Express)

Travel booking and reviews platform built with Express 5, MongoDB, Stripe Checkout, and Pug-rendered views. The app exposes a REST API for tours, users, bookings, and reviews, plus a server-rendered client for browsing and purchasing tours.

## Features

- User authentication with JWT cookies, signup/login/logout, password reset, and role-based access control (admin, lead-guide, guide, user).
- Tour management with image uploads (Multer + Sharp), CRUD, top-5 alias, stats aggregation, monthly plans, and geospatial queries (within radius, distance calculations).
- Bookings via Stripe Checkout, including redirect-based booking creation and booking listings per user.
- Reviews linked to tours/users with create/update/delete and validation hooks.
- Secure defaults: Helmet + CSP, rate limiting on API routes, cookie parsing, JSON/urlencoded body parsing, and request time stamping. Static assets served from `public/` views rendered with Pug.

## Tech Stack

- Runtime: Node.js, Express 5, TypeScript
- Database: MongoDB with Mongoose
- Payments: Stripe Checkout
- Views: Pug templates; client assets bundled with Parcel
- File handling: Multer (memory storage) + Sharp for image processing
- Validation & security: Joi-based request validation, Helmet CSP, rate limiting, cookie-parser, qs parsing

## Project Structure (high level)

- `src/` — application source (app/server setup, routes, controllers, models, utils)
- `public/` — static assets and bundled client JS
- `views/` — Pug templates for SSR pages
- `dev-data/data/` — sample seed data and importer script

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or hosted)
- Stripe account + test keys for checkout flows
- (Optional) Mail provider for password reset emails (Brevo or local SMTP per env vars)

## Environment Variables

Copy `env-example` to `.env` and fill in values:

- Core: `NODE_ENV`, `PORT`, `DATABASE`, `DATABASE_LOCAL`, `DATABASE_PASSWORD`
- Auth: `JWT_SECRET`, `JWT_EXPIRY`, `JWT_COOKIE_EXPIRY`
- Email (dev/prod): `EMAIL_HOST_DEV`, `EMAIL_PORT_DEV`, `EMAIL_FROM_DEV`, `EMAIL_HOST_PROD`, `EMAIL_PORT_PROD`, `EMAIL_USERNAME_PROD`, `EMAIL_PASSWORD_PROD`, `EMAIL_FROM_PROD`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`

## Installation

```bash
npm install
cp env-example .env  # then edit values
```

## Running in Development

- Start the API/server (TypeScript watch):

```bash
npm run dev
```

- Bundle client JS with Parcel (hot reload) in a second terminal:

```bash
npm run watch:js
```

- Open the app at `http://localhost:8000` (or your configured `PORT`).

## Running in Production

1. Build server and client bundles:

```bash
npm run build       # compile TypeScript to dist/
npm run build:js    # bundle public/js to public/js/bundle
```

2. Start the compiled server (set `NODE_ENV=production`):

```bash
NODE_ENV=production node dist/server.js
# or use the package script after adjusting if needed: npm run start
```

## Database Seeding

Seed or purge sample data (tours, users, reviews) using the importer:

```bash
# import sample data
tsx dev-data/data/import-dev-data.ts --import

# delete all sample collections
tsx dev-data/data/import-dev-data.ts --delete
```

Ensure your MongoDB connection variables are set in `.env` before running.

## Core API Endpoints (v1)

- Tours: `/api/v1/tours` (CRUD, stats, monthly plan, geospatial, top-5 alias)
- Users: `/api/v1/users` (signup/login/logout/reset password, me/updateMe/deleteMe, admin CRUD)
- Reviews: `/api/v1/reviews` and nested `/api/v1/tours/:tourId/reviews`
- Bookings: `/api/v1/bookings` and `/api/v1/bookings/checkout-session/:tourId`
- Views (SSR): `/`, `/tour/:slug`, `/login`, `/me`, `/my-tours`

## Development Notes

- Image uploads use in-memory storage; processed images are written to `public/img/tours` and `public/img/users`.
- CSP and rate limiting are enabled; adjust Helmet and limiter settings in `src/app.ts` if you embed additional resources.
- Static files are served from `public/`; Pug templates live under `views/`.

## Scripts

- `npm run dev` — start server with tsx watch
- `npm run debug` — start server with inspector enabled
- `npm run build` — compile TypeScript to `dist/`
- `npm run start` — run compiled app entry (ensure it points to the built server)
- `npm run watch:js` / `npm run build:js` — Parcel watch/build for client JS
- `npm run lint` — lint source files

## Troubleshooting

- Verify `.env` is loaded (server uses `dotenv` with `./.env`).
- If Stripe checkout redirects but no booking appears, ensure the query-string booking creation flow remains enabled in `viewsRoutes` and `bookingController`.
- For image processing errors, confirm `sharp` native deps are installed for your platform.
