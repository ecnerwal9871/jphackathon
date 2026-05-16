# ✈️ FlightBuddy

**Connect elderly solo travelers with kind volunteers on the same international flight.**

FlightBuddy is a volunteer platform that fills the gap for elderly people traveling alone. Travelers post their flight details, volunteers on the same route offer to help, and once both confirm the match, contact details are safely exchanged.

---

## Tech Stack

| Layer | Technology | Azure Service |
|---|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind | Azure Static Web Apps (Standard) |
| Backend API | Azure Functions v4 (TypeScript) | Integrated with SWA (`/api`) |
| Database | Cosmos DB for NoSQL | Serverless tier |
| Auth | Google OAuth 2.0 | SWA Easy Auth → Microsoft Entra External ID |
| Email | Azure Communication Services | ACS Email (managed domain) |
| Secrets | Azure Key Vault | Managed Identity access |
| Monitoring | Application Insights | Azure Monitor |
| CI/CD | GitHub Actions | `azure/static-web-apps-deploy` |

---

## Project Structure

```
├── app/                    # Next.js 14 frontend
│   ├── app/                # App Router pages
│   ├── components/         # Navbar, TripCard, MatchCard
│   └── lib/                # auth.ts, api.ts, types.ts, appInsights.ts
├── api/                    # Azure Functions v4
│   └── src/
│       ├── functions/      # trips, matches, profile endpoints
│       └── lib/            # cosmos.ts, auth.ts, email.ts, telemetry.ts
├── infra/                  # Azure Bicep + deployment script
│   ├── main.bicep          # All Azure resources
│   └── deploy.sh           # One-shot provisioning script
└── .github/workflows/      # GitHub Actions CI/CD
```

---

## Quick Start — Deploy to Azure

### Prerequisites
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and logged in (`az login`)
- A [Google Cloud OAuth 2.0 Client ID & Secret](https://console.cloud.google.com/apis/credentials)
  - Authorized redirect URI: `https://<your-swa-hostname>/.auth/login/google/callback`

### 1. Provision all Azure resources (one command)

```bash
cd infra
chmod +x deploy.sh
./deploy.sh
```

This provisions:
- Azure Static Web Apps (Standard)
- Cosmos DB (Serverless) with 3 containers
- Azure Communication Services + Email domain
- Key Vault (stores Google credentials)
- Application Insights + Log Analytics
- All managed identity role assignments

### 2. Add GitHub secret

After the script completes, add the printed token to your GitHub repo:

**Settings → Secrets and variables → Actions → New repository secret**

```
Name:  AZURE_STATIC_WEB_APPS_API_TOKEN
Value: <token printed by deploy.sh>
```

### 3. Push to `main`

```bash
git add .
git commit -m "Initial FlightBuddy deployment"
git push origin main
```

GitHub Actions automatically builds and deploys. Your app is live at:
`https://<swa-name>.azurestaticapps.net`

### 4. Update Google OAuth redirect URI

In Google Cloud Console → your OAuth app → Authorized redirect URIs, add:
```
https://<your-swa-hostname>/.auth/login/google/callback
```

---

## Local Development

Run **3 terminals**:

```bash
# Terminal 1 — Azure Functions API (port 7071)
cd api
npm install
npm run build
func start

# Terminal 2 — Next.js dev server (port 3000)
cd app
npm install
npm run dev

# Terminal 3 — SWA CLI emulator with auth (port 4280)
# This provides /.auth/login/google mock login for local testing
swa start http://localhost:3000 --api-devserver-url http://localhost:7071
```

**Open http://localhost:4280** (not 3000) to get the full experience including auth.

When you click "Sign in with Google" locally, SWA CLI shows a **mock login form** — just fill in any name/email to simulate being logged in. No real Google credentials needed.

> **Note:** To connect to a real Cosmos DB, fill in `api/local.settings.json` with your `COSMOS_ENDPOINT`.

---

## Pages

| Route | Description | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/dashboard` | Your trips and matches | Required |
| `/request` | Post an assistance request | Required |
| `/volunteer` | Post a volunteer offer | Required |
| `/matches` | Browse requests matching your volunteer trip | Required |
| `/matches/[id]` | Match detail + contact reveal on confirmation | Required |
| `/profile` | Edit name, phone, language | Required |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/trips` | Create a request or volunteer trip |
| `GET` | `/api/trips` | List current user's trips |
| `GET` | `/api/trips/matches` | Get open requests matching your volunteer trip |
| `POST` | `/api/matches` | Volunteer creates a match |
| `PUT` | `/api/matches/{id}/confirm` | Requester confirms a match |
| `GET` | `/api/matches/{id}` | Match detail (contacts revealed when confirmed) |
| `GET` | `/api/profile` | Get current user profile |
| `PUT` | `/api/profile` | Update name, phone, language |

---

## Security

- 🔒 Contact numbers **never exposed** before match is confirmed
- 🔐 All protected routes blocked at CDN edge via `staticwebapp.config.json`
- 🛡️ API reads identity from `x-ms-client-principal` (injected by SWA — cannot be spoofed)
- 🗝️ Google credentials stored in Key Vault, accessed via Managed Identity (no stored secrets)
- 🔑 Cosmos DB accessed via RBAC/Managed Identity — no connection strings in environment variables

---

## Data Retention (GDPR)

Cosmos DB TTL is enabled on the `trips` container. Each trip document sets a `ttl` value equal to 30 days after the travel date. Trips are **automatically deleted** after that point.

---

## Architecture

```
Browser → Azure Static Web Apps (CDN + Next.js SSR)
               │
               ├── SWA Easy Auth ──► Entra External ID ──► Google OAuth
               │
               └── Azure Functions v4 (/api/*)
                        │              │
                   Cosmos DB      Azure Communication
                  (Serverless)    Services (Email)
                        │
                   Key Vault (via Managed Identity)
                        │
                   App Insights (telemetry)
```
