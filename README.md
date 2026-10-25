# ScanLead (vuln-agent-web)

Marketing + scan UI for [vuln-agent](https://github.com/chaitanya07422/vuln-agent).

- No signup / login
- Paste URL + ownership attestation
- Polls the API and shows findings + downloadable brief

## Run locally

Terminal 1 — API:

```bash
cd ../vuln-agent
source .venv/bin/activate
uvicorn vuln_agent.main:app --port 8000
```

Terminal 2 — web:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://127.0.0.1:3000

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_URL` | `http://127.0.0.1:8000` | Backend base URL used by Next.js route proxies |
