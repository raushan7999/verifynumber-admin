# VerifyNumber Admin

Admin panel for [VerifyNumber](https://verifynumber.in): gateway devices and SIMs (live status,
enable/disable, revoke), enrollment codes, and inbound SMS. React + Vite + Tailwind CSS,
hosted on GitHub Pages at **https://admin.verifynumber.in**.

## How access works

- Sign in with **email + password**. An account gets in only if **both** are true:
  1. its email is listed in `ADMIN_EMAILS` in the backend `.env`, and
  2. it has the admin role. Sign up on verifynumber.in first, then on the server run:
     ```bash
     sudo systemd-run --quiet --pipe --wait -p EnvironmentFile=/root/verifynumber/api.env \
       -p User=verifynumber /root/verifynumber/api/verifynumber-api promote-admin you@example.com
     ```
     (`demote-admin` reverses it.)
- Removing an email from `ADMIN_EMAILS` (and restarting the API) revokes access immediately.
- Sessions are an HttpOnly cookie on `api.verifynumber.in` (12 h). `admin.verifynumber.in` is the same
  site, so no tokens are ever stored in the browser.
- **Google Sign-In** is built in and switches on when `GOOGLE_CLIENT_ID` is set in the backend `.env`
  (OAuth client type "Web application", authorized JavaScript origin `https://admin.verifynumber.in`).

## Develop

```bash
npm install
npm run dev            # http://localhost:5173, proxies /v1 to the Go API on 127.0.0.1:8080
```

The local backend needs `ALLOWED_ORIGINS` to include `http://localhost:5173` only if you call it directly;
with the dev proxy, requests are same-origin.

## Deploy

Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
`public/CNAME` sets the custom domain; `404.html` (a copy of `index.html`) makes deep links work.
The API URL is set at build time (`VITE_API_URL`, see `.env.production`).
