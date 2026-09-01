# Aureum Insights API

FastAPI + LangGraph service that turns **deterministic analytics** into grounded financial insights.

The LLM never calculates totals, percentages, balances, or budget utilization. Python does.

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8002
```

Model provider is NVIDIA (`moonshotai/kimi-k3`):

```env
NVIDIA_API_KEY=
NVIDIA_MODEL=moonshotai/kimi-k3
```

If the NVIDIA API is unreachable, the API still returns calculated insights.

## Tests

```bash
cd backend
pytest
```

## Auth

- Local frontend: `Authorization: Bearer local.{userId}` plus a finance `snapshot`
- Supabase: user JWT. The service loads that user's rows only.
