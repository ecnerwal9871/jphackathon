# FlightBuddy – Elderly Traveler Assistance Platform
> **Architect-validated plan — Azure best practices (2025)**

## Problem Statement
Elderly people traveling alone on international flights need assistance or companionship.
This platform connects them with willing volunteers traveling the same route, enabling
safe contact exchange after a match is made.

---

## Tech Stack (Azure) — Validated

| Layer | Technology | Azure Service | Notes |
|---|---|---|---|
| Frontend | Next.js 14 App Router | Azure Static Web Apps (Standard) | Hybrid SSR + CDN |
| Backend API | Node.js TypeScript | Azure Functions v4 (SWA integrated `/api`) | Serverless, co-deployed with SWA |
| Database | Azure Cosmos DB for NoSQL | Cosmos DB **Serverless** tier | Cost-efficient for early stage |
| Authentication | Google OAuth 2.0 | **Microsoft Entra External ID** | Modern replacement for Azure AD B2C |
| Auth Strategy | SWA Easy Auth | Built-in SWA Authentication | No NextAuth.js needed; simpler & Azure-native |
| Email Notifications | Azure Communication Services | ACS Email (Managed Domain) | Email on match creation & confirmation |
| CI/CD | GitHub Actions | `azure/static-web-apps-deploy` action | Auto-staging envs on PRs |
| Secrets | Azure Key Vault | Key Vault + Managed Identity | Functions access secrets without credentials |
| Monitoring | Application Insights | Azure Monitor Workspace | Traces, errors, conversion metrics |

### Why These Choices (Architect Notes)

- **Entra External ID over Azure AD B2C:** Microsoft announced B2C is being phased out in favour of Entra External ID for consumer-facing apps. New projects in 2025 should use Entra External ID.
- **SWA Easy Auth over NextAuth.js:** For an Azure-native SWA project, built-in auth is simpler, more secure (Microsoft manages token storage), and eliminates a dependency. No custom OAuth code required.
- **Cosmos DB Serverless:** At early/hackathon scale, serverless billing (pay-per-request) is far cheaper than provisioned RU/s. Upgrade to provisioned when traffic warrants.
- **SWA Standard tier:** Required for custom auth providers (Entra External ID) and custom domains with managed TLS certificates.
- **Managed Identity:** Azure Functions use a system-assigned managed identity to access Cosmos DB and Key Vault — no connection strings in environment variables.

---

## Core User Roles

1. **Requester** – Elderly traveler who needs help
2. **Volunteer** – Another traveler offering to assist

---

## Monorepo Folder Structure

```
/jphackathon
├── /app                          # Next.js 14 frontend (App Router)
│   ├── /app                      # Route segments
│   │   ├── page.tsx              # Landing /
│   │   ├── /dashboard/page.tsx
│   │   ├── /request/page.tsx
│   │   ├── /volunteer/page.tsx
│   │   ├── /matches/page.tsx
│   │   ├── /matches/[id]/page.tsx
│   │   └── /profile/page.tsx
│   ├── /components               # Shared UI components
│   ├── /lib                      # Utilities, types, Cosmos DB client
│   └── staticwebapp.config.json  # SWA routing + auth rules
├── /api                          # Azure Functions v4 (integrated with SWA)
│   ├── trips.ts                  # POST/GET /api/trips
│   ├── tripsMatches.ts           # GET /api/trips/matches
│   ├── matches.ts                # POST /api/matches
│   ├── matchesById.ts            # GET/PUT /api/matches/:id
│   └── profile.ts                # GET/PUT /api/profile
├── .github/workflows/
│   └── azure-static-web-apps.yml
├── package.json
└── PLAN.md
```

---

## Data Models (Cosmos DB)

> **Partition Key Strategy (Architect Note):**
> - `users` → partition key: `/id` (userId) — high cardinality, user-scoped queries
> - `trips` → partition key: `/userId` — keeps user's trips together; route-matching uses cross-partition queries (acceptable at this scale)
> - `matches` → partition key: `/requesterId` — requester confirmation flow is the hot path
> - All containers use **Cosmos DB Serverless** — no RU/s to provision

### `users` container — partition key: `/id`
```json
{
  "id": "uuid",
  "entraPrincipalId": "string (from Entra External ID)",
  "name": "string",
  "email": "string",
  "phone": "string (stored encrypted)",
  "preferredLanguage": "string",
  "createdAt": "ISO8601"
}
```

### `trips` container — partition key: `/userId`
```json
{
  "id": "uuid",
  "userId": "string",
  "type": "request | volunteer",
  "fromAirport": "string (IATA, e.g. JFK)",
  "toAirport": "string (IATA, e.g. LHR)",
  "travelDate": "YYYY-MM-DD",
  "airline": "string (lowercased for matching)",
  "flightNumber": "string (optional)",
  "contactNumber": "string (stored encrypted)",
  "language": "string",
  "notes": "string",
  "status": "open | matched | closed",
  "matchedTripId": "string | null",
  "expiresAt": "ISO8601 (travelDate + 30 days, for TTL auto-delete)",
  "createdAt": "ISO8601"
}
```

### `matches` container — partition key: `/requesterId`
```json
{
  "id": "uuid",
  "requestTripId": "string",
  "volunteerTripId": "string",
  "requesterId": "string",
  "volunteerId": "string",
  "status": "pending | confirmed | cancelled",
  "createdAt": "ISO8601"
}
```

> **Cosmos DB TTL:** Enable TTL on the `trips` container with `defaultTtl = -1` and set `ttl` per document to auto-delete 30 days after travel date (GDPR compliance).

---

## App Pages / Routes

| Route | Description |
|---|---|
| `/` | Landing page – hero, how it works, CTA |
| `/auth/signin` | Google sign-in via Azure AD B2C |
| `/dashboard` | User dashboard (trips, matches) |
| `/request` | Form: post a travel assistance request |
| `/volunteer` | Form: post a volunteer trip |
| `/matches` | View & browse matching trips |
| `/matches/[id]` | Match detail + contact exchange |
| `/profile` | Edit profile, phone, language |

---

## Azure Functions API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/trips | Create a trip (request or volunteer) |
| GET | /api/trips | List trips by user |
| GET | /api/trips/matches | Find matching trips for current user |
| POST | /api/matches | Create a match (volunteer picks a request) |
| PUT | /api/matches/:id/confirm | Requester confirms a match |
| GET | /api/matches/:id | Get match details + unlock contacts |
| GET | /api/profile | Get current user profile |
| PUT | /api/profile | Update profile (phone, language, name) |

---

## Authentication Flow (Microsoft Entra External ID + SWA Easy Auth)

> **No NextAuth.js required.** Azure SWA's built-in authentication handles the full OAuth flow natively.

1. User visits site → SWA redirects unauthenticated requests to `/.auth/login/google`
2. SWA Easy Auth (backed by Entra External ID) handles Google OAuth 2.0 exchange
3. SWA sets a secure `StaticWebAppsAuthCookie` (httpOnly, managed by Azure)
4. Frontend reads identity via `GET /.auth/me` (returns `userId`, `userDetails`, `identityProvider`)
5. API calls include the cookie automatically; Azure Functions read the `x-ms-client-principal` header to get the authenticated user identity
6. On first sign-in, the Functions middleware auto-creates a user record in Cosmos DB

### `staticwebapp.config.json` auth rules
```json
{
  "auth": {
    "identityProviders": {
      "google": {
        "registration": {
          "clientIdSettingName": "GOOGLE_CLIENT_ID",
          "clientSecretSettingName": "GOOGLE_CLIENT_SECRET"
        }
      }
    }
  },
  "routes": [
    { "route": "/api/*", "allowedRoles": ["authenticated"] },
    { "route": "/dashboard", "allowedRoles": ["authenticated"] },
    { "route": "/request", "allowedRoles": ["authenticated"] },
    { "route": "/volunteer", "allowedRoles": ["authenticated"] },
    { "route": "/matches/*", "allowedRoles": ["authenticated"] },
    { "route": "/profile", "allowedRoles": ["authenticated"] }
  ],
  "responseOverrides": {
    "401": { "redirect": "/.auth/login/google", "statusCode": 302 }
  }
}
```

---

## Matching Logic

A volunteer trip matches a request if:
- `fromAirport` == `fromAirport`
- `toAirport` == `toAirport`
- `travelDate` == `travelDate` (or ±1 day tolerance)
- `airline` == `airline` (case-insensitive)
- Both trips have `status == "open"`

---

## Contact Exchange Flow

1. Volunteer browses `/matches` → sees open requests that match their trip
2. Volunteer clicks "I'll Help" → `POST /api/matches`
3. Both users receive email notification (Azure Communication Services)
4. Requester logs in → confirms the match (`PUT /api/matches/:id/confirm`)
5. Match `status = "confirmed"` → both users can see each other's contact number
6. Contact details revealed only on confirmed match detail page

---

## Language Feature

- User sets preferred language in profile
- Displayed on trip card (e.g., "Speaks: Tamil, English")
- Volunteer can filter matches by language
- UI supports i18n via `next-intl` (future phase)

---

## Implementation Todos (in order)

1. `project-scaffold` – Scaffold Next.js 14 app with TypeScript + Tailwind CSS
2. `azure-b2c-setup` – Configure Azure AD B2C tenant + Google IdP
3. `cosmos-db-setup` – Create Cosmos DB account, database, and containers
4. `auth-integration` – Integrate NextAuth.js with Azure AD B2C provider
5. `api-functions` – Build Azure Functions: trips, matches, profile endpoints
6. `frontend-landing` – Build landing page (hero, how it works, CTA)
7. `frontend-forms` – Build request and volunteer trip forms
8. `frontend-matches` – Build matches browse page and match detail page
9. `frontend-dashboard` – Build user dashboard
10. `frontend-profile` – Build profile edit page
11. `notifications` – Azure Communication Services email on match
12. `deployment` – Azure Static Web Apps CI/CD via GitHub Actions
13. `key-vault` – Secrets management via Azure Key Vault
14. `app-insights` – Application Insights monitoring

---

## Azure Resources to Provision

```
Resource Group:           rg-flightbuddy-prod
Static Web App:           swa-flightbuddy            (Standard tier — required for custom auth)
  └── Integrated API:     Azure Functions v4 in /api folder
Cosmos DB Account:        cosmos-flightbuddy          (Serverless, NoSQL)
  └── Database:           flightbuddy
      ├── Container:      users      (partition: /id)
      ├── Container:      trips      (partition: /userId, TTL enabled)
      └── Container:      matches    (partition: /requesterId)
Entra External ID:        flightbuddyexternal         (Google IdP configured)
Communication Services:   acs-flightbuddy
  └── Email Domain:       (managed domain, no custom domain needed at launch)
Key Vault:                kv-flightbuddy
App Insights:             appi-flightbuddy
```

### Managed Identity Connections (no stored secrets in app settings)
```
swa-flightbuddy (system-assigned identity)
  → Cosmos DB: "Cosmos DB Built-in Data Contributor" role
  → Key Vault: "Key Vault Secrets User" role
  → ACS:       "Contributor" role
```

---

## Deployment Architecture

```
User Browser
    │
    ▼
Azure Static Web Apps — Standard Tier
    ├── Global CDN (static assets, ISR pages)
    ├── SWA Easy Auth ──────────────────────► Microsoft Entra External ID
    │       └── Google OAuth 2.0 ◄──────────────────────────────────────────┘
    │
    ├── Next.js 14 App Router (SSR + SSG)
    │
    └── Azure Functions v4 (/api/*)
            │                   │
            ▼                   ▼
      Cosmos DB           Azure Communication Services
      (Serverless)        (Email on match events)
            │
            ▼
      Key Vault (secrets via Managed Identity)
            │
            ▼
      App Insights (monitoring & tracing)
```

### GitHub Actions CI/CD
- Every push to `main` → deploy to production SWA
- Every PR → deploy to a unique **staging environment URL** (auto-generated)
- Staging envs auto-deleted when PR is closed

---

## Copilot Prompt for Full Implementation

Use this prompt with GitHub Copilot to scaffold the entire app:

---

> **Build a full-stack web application called "FlightBuddy"** that helps elderly people
> traveling alone on international flights connect with volunteers on the same journey.
>
> **Tech stack (Azure-validated, 2025):**
> - **Frontend:** Next.js 14 App Router with TypeScript, Tailwind CSS, `next-intl` for i18n
> - **Backend:** Azure Functions v4 (TypeScript) in an `/api` folder — co-deployed with SWA
> - **Database:** Azure Cosmos DB for NoSQL (Serverless tier)
>   - Container `users` — partition key: `/id`
>   - Container `trips` — partition key: `/userId`, TTL enabled (30 days after travelDate)
>   - Container `matches` — partition key: `/requesterId`
> - **Auth:** Microsoft Entra External ID with Google sign-in via **SWA Easy Auth** (built-in, no NextAuth.js). Routes protected via `staticwebapp.config.json`. User identity read from `x-ms-client-principal` header in Functions and from `/.auth/me` in the frontend.
> - **Notifications:** Azure Communication Services Email SDK on match creation and confirmation
> - **Deployment:** Azure Static Web Apps (Standard tier) with GitHub Actions CI/CD (`azure/static-web-apps-deploy` action)
> - **Secrets:** Azure Key Vault accessed via Managed Identity (no stored connection strings)
> - **Monitoring:** Application Insights
>
> **Core flows:**
> 1. Requester posts trip: from airport (IATA), to airport (IATA), travel date, airline, contact number (stored encrypted), language preference, optional notes
> 2. Volunteer posts their trip with the same fields
> 3. System shows volunteers all open requests matching their route/date/airline (cross-partition Cosmos DB query)
> 4. Volunteer clicks "I'll Help" — a pending match is created and both get email notification via ACS
> 5. Requester confirms the match — contacts are revealed to both parties on the match page (only when `match.status === "confirmed"`)
>
> **Pages to build:**
> Landing (`/`), Dashboard (`/dashboard`), Post Request (`/request`),
> Post Volunteer (`/volunteer`), Browse Matches (`/matches`),
> Match Detail (`/matches/[id]`), Profile (`/profile`)
>
> **API endpoints (Azure Functions v4):**
> - `POST /api/trips` – create trip (requires authenticated user from x-ms-client-principal)
> - `GET /api/trips` – list current user's trips
> - `GET /api/trips/matches` – find open requests matching current user's volunteer trip
> - `POST /api/matches` – volunteer creates a match
> - `PUT /api/matches/{id}/confirm` – requester confirms match
> - `GET /api/matches/{id}` – get match detail; return contacts only if status === confirmed
> - `GET /api/profile` – get current user profile
> - `PUT /api/profile` – update name, phone, language
>
> **`staticwebapp.config.json`:** Protect `/api/*`, `/dashboard`, `/request`, `/volunteer`, `/matches/*`, `/profile` with `"allowedRoles": ["authenticated"]`. Redirect 401 to `/.auth/login/google`.
>
> **Matching logic:** Volunteer trip matches request if `fromAirport`, `toAirport`, `airline` (case-insensitive) match and `travelDate` is within ±1 day. Both trips must have `status === "open"`.
>
> **UI/UX requirements (elderly users):**
> - Base font size 18px minimum, headings 28px+
> - High-contrast colours (WCAG AA)
> - Large tap targets (48px+ on buttons)
> - Simple single-purpose pages, no cluttered layouts
> - Mobile responsive with clear status badges (Open / Pending / Confirmed)
> - Language tag chips on trip cards
>
> Scaffold the full monorepo project structure (`/app` for Next.js, `/api` for Azure Functions), implement all pages, API functions with `@azure/cosmos` SDK, SWA Easy Auth integration, ACS email notifications, Key Vault secret references, and the GitHub Actions deployment workflow.

---

## Notes & Considerations

### Security
- **Contacts encrypted at rest:** Phone numbers encrypted before storing in Cosmos DB (AES-256 via Key Vault-managed key)
- **Contacts never exposed before match confirmation:** API enforces `match.status === "confirmed"` before returning contact fields
- **SWA auth routes:** `staticwebapp.config.json` blocks unauthenticated access to all protected routes at the CDN edge — before the Functions even run
- **Managed Identity:** No connection strings stored in app settings; Functions use role-based access to Cosmos DB and Key Vault
- **HTTPS enforced:** SWA enforces HTTPS by default; no configuration needed
- **Input validation:** All API inputs validated with `zod` before processing

### Accessibility (Elderly Users)
- Base font size: 18px minimum; headings 28px+
- High-contrast colour scheme (WCAG AA compliant)
- Large tap targets (48px minimum) on all buttons
- Single-purpose pages — no cluttered layouts
- Clear progress indicators on multi-step flows

### Cost Estimate (Early Stage)
| Resource | Tier | Est. Monthly Cost |
|---|---|---|
| Azure Static Web Apps | Standard | ~$9/mo |
| Cosmos DB | Serverless | ~$0–5/mo (pay per request) |
| Azure Functions | Included in SWA | $0 |
| Azure Communication Services | Pay-per-use (email) | ~$1/mo |
| Key Vault | Standard | ~$0.03/mo |
| **Total** | | **~$15–20/mo** |

### GDPR / Data Retention
- Cosmos DB TTL set on `trips` container; documents auto-deleted 30 days after `travelDate`
- Users can delete their account and all associated data via profile page
- Contact numbers stored encrypted and never logged

### Future Enhancements
- **Flight validation:** Integrate AviationStack or Amadeus API to validate flight numbers
- **In-app messaging:** Replace contact reveal with secure in-app chat (Azure Web PubSub)
- **SMS notifications:** Azure Communication Services SMS on match confirmation
- **i18n:** `next-intl` for full UI translation (priority languages: Tamil, Hindi, Spanish, French)
- **Admin dashboard:** Volunteer/request analytics, abuse reporting
