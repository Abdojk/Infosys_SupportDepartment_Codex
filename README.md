# D365 CE Department Dashboard

A static, browser-only internal dashboard for Microsoft Dynamics 365 Customer Engagement / Dataverse.

This project uses:
- HTML + CSS + Vanilla JavaScript (ES modules)
- Microsoft Entra ID authentication with MSAL (redirect flow)
- Dataverse OData v4 Web API
- Chart.js for visualizations

No backend, no proxy, no npm, and no build step are required.

---

## File Structure

```text
.
├── index.html
├── login.html
├── config/
│   └── config.js
├── css/
│   ├── main.css
│   ├── dashboard.css
│   └── components.css
├── js/
│   ├── auth.js
│   ├── api.js
│   ├── cases.js
│   ├── timesheets.js
│   ├── charts.js
│   ├── utils.js
│   └── main.js
├── vendor/
│   └── msal-browser.min.js   (official bundle required)
└── README.md
```

---

## Authentication Flow (Redirect Only)

1. User lands on `login.html`.
2. `handleRedirect()` processes any Entra redirect response.
3. If an account exists, user is sent to `index.html`.
4. If no account, user clicks **Sign in with Microsoft**.
5. App calls `loginRedirect()`.
6. On `index.html`, app verifies auth; unauthenticated users are redirected to `login.html`.
7. API calls request tokens using `acquireTokenSilent()` first.
8. If silent token acquisition requires interaction, app falls back to `acquireTokenRedirect()`.

---

## Required Entra App Registration

Configure a **Single Page Application (SPA)** app registration:

- **Application (client) ID** → `clientId`
- **Directory (tenant) ID** → `tenantId`
- **Redirect URI** (SPA):
  - `https://<your-host>/login.html`
- **Post logout redirect URI**:
  - `https://<your-host>/login.html`

### Dataverse Delegated Permission

The app requests:

- `https://<your-org>.crm.dynamics.com/user_impersonation`

Grant consent according to your organization policy.

---

## Configure `config/config.js`

Edit placeholders:

```js
const orgUrl = 'https://your-org.crm.dynamics.com';

export const CONFIG = {
  tenantId: 'YOUR_TENANT_ID',
  clientId: 'YOUR_CLIENT_ID',
  redirectUri: `${window.location.origin}/login.html`,
  postLogoutRedirectUri: `${window.location.origin}/login.html`,
  orgUrl,
  apiVersion: '9.2',
  scopes: [`${orgUrl}/user_impersonation`]
};
```

- `orgUrl` must match your Dataverse environment URL.
- `scopes` is automatically built from `orgUrl`.

---

## MSAL Browser Bundle Requirement (No npm)

This project expects a local browser file at:

- **`/vendor/msal-browser.min.js`**

### Exactly what file to obtain

Use the official browser bundle from the `@azure/msal-browser` package:

- `lib/msal-browser.min.js`

### Where to place it

Copy that official file to:

- `vendor/msal-browser.min.js`

### Where it is referenced

- `index.html` script tag:
  - `<script src="./vendor/msal-browser.min.js"></script>`
- `login.html` script tag:
  - `<script src="./vendor/msal-browser.min.js"></script>`

The repository includes a placeholder stub file at this path. Replace it before use.

---

## Running Locally

Because this is a static SPA, serve files from any static host.

Examples:
- Internal IIS/static web server
- GitHub Pages (if organizationally allowed)
- Any static hosting endpoint with HTTPS

Open:
- `https://<host>/login.html`

> Use HTTPS for Entra redirect URIs except localhost development scenarios permitted by your tenant policy.

---

## Features Implemented

- Sidebar navigation and logout
- Filter bar for owner/status/priority/date range
- KPI cards:
  - Total Cases
  - Active Cases
  - Resolved Cases
  - Total Hours
  - Active Owners Count
- Cases table with status/priority badges
- Time entry aggregation cards by owner
- Charts:
  - Cases By Status (doughnut)
  - Hours By Owner (horizontal bar via `indexAxis: 'y'`)
  - Cases Trend (last 30 days line)
- Server-side OData filtering and pagination support
- Error/loader/empty-state UX patterns per widget

---

## Troubleshooting

### 1) “MSAL browser library not found”
- Cause: placeholder `vendor/msal-browser.min.js` not replaced.
- Fix: copy the official `lib/msal-browser.min.js` bundle into `vendor/`.

### 2) Redirect loops to login
- Verify `tenantId`, `clientId`, and SPA redirect URI exactly match app registration.
- Ensure `redirectUri` in config points to `/login.html`.
- Confirm browser is not blocking session storage.

### 3) 401/403 from Dataverse API
- Ensure `scopes` resolves to `<orgUrl>/user_impersonation`.
- Confirm delegated permission and consent are granted.
- Verify signed-in user has Dataverse access.

### 4) No data in dashboard
- Confirm entity access and field-level security.
- Validate logical names and environment data:
  - `incidents`
  - `msdyn_timeentries`
  - `systemusers`

### 5) CORS or network errors
- Ensure you are calling the correct `orgUrl`.
- Confirm environment allows browser-origin API access for authenticated SPA calls.

---

## Security Notes

- Do not commit real tenant/client IDs in public repositories.
- Use least-privilege permissions and conditional access controls.
- Treat browser tokens as sensitive; this app stores auth state in `sessionStorage`.
- Restrict who can access the dashboard URL.
- Review sign-in logs and Dataverse audit logs regularly.
