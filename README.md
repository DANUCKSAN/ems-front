# EventHub frontend — 1.0 deployment candidate

EventHub is a React application for discovering, booking, and managing events. It connects to the EventHub Spring Boot API and provides dedicated attendee, host, and administrator workflows.

Release status: `1.0.0-rc.1`. This is a deployment candidate, subject to staging validation of payments, email delivery, database migrations, monitoring, backups, and recovery procedures before a public launch.

## Capabilities

- Public event discovery, search, filtering, recommendations, event details, seat availability, and attendee reviews
- Attendee registration, password plus email MFA login, secure Stripe Checkout, booking history, cancellations, refunds, and reviews
- Host registration and approval, event creation and editing, booking visibility, Stripe refund submission, and review replies
- Administrator MFA login, host and event approval, and account moderation
- Bearer-authenticated private API access with role-protected routes and server-controlled session expiry
- Responsive navigation, accessible form controls, loading/error/empty states, and route-level code splitting

Administrator accounts are not created through the public frontend. They must be provisioned through the backend's controlled bootstrap process.

## Technology

- React 19 and React Router
- Ant Design
- GSAP and AOS
- Vite build tooling and Vitest with jsdom
- Native Fetch through the shared `src/utils/api.js` client

## Requirements

- Node.js 20.19+
- npm 10+
- A running EventHub backend
- Backend Stripe and email/MFA configuration for paid bookings and sign-in

## Configuration

Copy `.env.example` to `.env.local` and set the public API origin:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

For a hosted build, use the externally reachable HTTPS API origin without a trailing slash. `VITE_*` values are embedded into the browser bundle, so never place secrets in them. Stripe secret keys and webhook secrets belong only on the backend.

If `VITE_API_BASE_URL` is omitted, the client uses same-origin `/api/...` requests.

## Local development

```bash
# If Node Version Manager is installed, align with .nvmrc first:
nvm install
nvm use
npm ci
npm run dev
```

The development server runs on `http://localhost:5173` by default. `npm start` is an alias for the same Vite server; `npm run preview` serves a completed production build locally.

## Quality checks

```bash
npm run lint
npm run build
npm test
npm run audit:runtime
npm run audit:all
```

The runtime audit gate contains one narrow, documented exception for a React
Router RSC/Server Action advisory. EventHub is a static `BrowserRouter` app and
does not use that mode. Remove the exception as soon as a patched release is
published. `audit:all` applies the same narrowly scoped exception while also
blocking unrelated high or critical development-tooling findings. Unit tests
cover the shared authentication/API boundaries and legal copy; automated browser
E2E, accessibility, and live Stripe tests remain staging release gates.

## CI and release artifacts

GitHub Actions runs locked installation, linting, unit tests, a production build,
and the complete dependency audit for pull requests, `main`, and manual CI runs.
Separate pinned workflows perform CodeQL analysis and dependency review.

The `Frontend Release Build` workflow creates verified artifacts but does not
deploy them. Before using it, create `staging` and `production` GitHub
environments and define a public environment variable named
`VITE_API_BASE_URL` in each. It must be an exact HTTPS API origin without a
trailing slash. Configure required reviewers on the production environment in
GitHub repository settings.

The workflow validates the selected environment, runs every quality gate,
rejects source maps, loopback or placeholder URLs, and common secret patterns,
then uploads a deterministic `dist` archive with its SHA-256 checksum and build
provenance attestation. Production artifacts are restricted to `main` or
semantic `v*` release tags. Deployment and rollback remain provider-specific
follow-up steps.

## Main routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Event discovery |
| `/event/:id` | Public | Event details, seats, checkout entry, and reviews |
| `/register` | Public | Attendee registration |
| `/login` | Public | Attendee MFA login |
| `/my-events` | Attendee | Booking history and cancellations |
| `/booking-confirmation` | Attendee | Stripe/free-booking reconciliation and receipt |
| `/update-account` | Attendee | Profile management |
| `/host-register` | Public | Host application |
| `/host-login` | Public | Host MFA login |
| `/dashboard` | Host | Events, bookings, refunds, and reviews |
| `/host-update` | Host | Host profile management |
| `/admin-login` | Public | Administrator MFA login |
| `/admin-dashboard` | Administrator | Approval and moderation controls |
| `/terms` | Public | Terms of service |

## Authentication

Each MFA verification endpoint returns an `accessToken`, `expiresAt`, `principal`, and role profile. The client:

1. stores the active token and only one role profile;
2. adds `Authorization: Bearer <token>` to private requests;
3. clears the session and returns to the correct login page on expiry or HTTP 401;
4. relies on backend authorization for every private resource and mutation.

The browser route guards improve navigation, but the backend remains the security boundary.

## Booking and payment flow

1. The attendee selects the exact ticket quantity and seats.
2. The client requests `POST /api/payments/checkout-session` with a unique `Idempotency-Key`.
3. Free bookings are confirmed immediately by the backend.
4. Paid bookings redirect to Stripe Checkout; EventHub never collects or stores card details.
5. A customer who cancels Checkout returns to the event and can resume the same owned, still-open Session while the seat hold is active.
6. Successful Checkout returns to `/booking-confirmation?session_id=...`.
7. The client reconciles immediately, briefly polls while delayed payment is pending, and displays distinct confirmed, failed, expired, refund, and manual-review states.
8. Signed Stripe webhooks remain authoritative for payment and refund state.

## Deployment

Build with:

```bash
npm ci
npm run build
```

Deploy the generated `dist/` directory to a static host. `public/_redirects` provides the SPA route fallback for compatible hosts, while `public/_headers` supplies baseline browser security and caching headers. Production source maps are disabled by default in `vite.config.mjs`.

Set `VITE_API_BASE_URL` before the build and configure the backend CORS allow-list and frontend return URL for the final HTTPS domain. See the [production deployment guide](https://github.com/DanSihe/emsbackend/blob/main/docs/PRODUCTION_DEPLOYMENT.md) for the complete backend, Stripe webhook, database, email, and operations checklist.
The [environment setup guide](https://github.com/DanSihe/emsbackend/blob/main/docs/ENVIRONMENT_SETUP.md)
lists every frontend and backend variable and explains where to obtain it.
The [environment ownership matrix](https://github.com/DanSihe/emsbackend/blob/main/docs/ENVIRONMENT_MATRIX.md)
shows exactly which values live on a laptop, in CI, in staging, and in production.
