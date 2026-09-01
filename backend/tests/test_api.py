from datetime import date

from app.core.config import parse_cors_origins
from app.repositories.insights import save_analysis
from app.schemas.insights import AnalysisPeriod, AnalyzeResponse, FinancialInsight


def test_parse_cors_origins_strips_quotes_and_slashes():
    assert parse_cors_origins(' "https://app.vercel.app/" , http://localhost:5173 ') == [
        "https://app.vercel.app",
        "http://localhost:5173",
    ]


def _preflight(client, origin: str, path: str = "/api/insights/analyze"):
    return client.options(
        path,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type,x-user-id",
        },
    )


def test_cors_preflight_allows_local_origin(client):
    response = _preflight(client, "http://localhost:5173")
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_preflight_allows_vercel_origin(client):
    origin = "https://aureum-expense-manager.vercel.app"
    response = _preflight(client, origin)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_preflight_allows_vercel_preview_origin(client):
    origin = "https://aureum-expense-manager-9nsvd0egl-abhijith0212s-projects.vercel.app"
    response = _preflight(client, origin)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_cors_preflight_rejects_unknown_origin(client):
    response = _preflight(client, "https://evil.example")
    assert response.status_code == 400


def test_analyze_requires_auth(client):
    response = client.post("/api/insights/analyze", json={"preset": "current_month"})
    assert response.status_code == 401


def test_analyze_and_user_isolation(client, snapshot, user_id):
    payload = {
        "start_date": "2026-09-01",
        "end_date": "2026-09-30",
        "snapshot": snapshot.model_dump(by_alias=True, mode="json"),
    }
    ok = client.post("/api/insights/analyze", json=payload, headers={"Authorization": f"Bearer local.{user_id}"})
    assert ok.status_code == 200
    body = ok.json()
    assert body["insights"]
    assert body["used_fallback"] is True
    assert "metrics" in body

    other = client.get("/api/insights/latest", headers={"Authorization": "Bearer local.user-2"})
    assert other.json() is None

    latest = client.get("/api/insights/latest", headers={"Authorization": f"Bearer local.{user_id}"})
    assert latest.status_code == 200
    assert latest.json()["summary"] == body["summary"]


def test_snapshot_user_mismatch_forbidden(client, snapshot):
    payload = {
        "start_date": "2026-09-01",
        "end_date": "2026-09-30",
        "snapshot": snapshot.model_dump(by_alias=True, mode="json"),
    }
    response = client.post("/api/insights/analyze", json=payload, headers={"Authorization": "Bearer local.intruder"})
    assert response.status_code == 403


def test_chat_uses_metrics(client, snapshot, user_id):
    payload = {
        "message": "What were my biggest expenses?",
        "start_date": "2026-09-01",
        "end_date": "2026-09-30",
        "snapshot": snapshot.model_dump(by_alias=True, mode="json"),
    }
    response = client.post("/api/insights/chat", json=payload, headers={"Authorization": f"Bearer local.{user_id}"})
    assert response.status_code == 200
    body = response.json()
    text = body["answer"] + (body.get("message") or {}).get("content", "")
    assert "18500" in text or "18,500" in text or "XYZ" in text
    assert body["conversation_id"]
    other = client.get("/api/insights/conversations", headers={"Authorization": "Bearer local.user-2"})
    assert other.json() == []


def test_feedback_isolation(client, user_id):
    save_analysis(
        user_id,
        AnalyzeResponse(
            summary="ok",
            financial_health_summary="ok",
            insights=[
                FinancialInsight(
                    id="ins-1",
                    type="spending",
                    title="t",
                    summary="s",
                    explanation="e",
                    severity="info",
                )
            ],
            metrics={},
            generated_at="2026-09-16T00:00:00Z",
            analysis_period=AnalysisPeriod(
                start=date(2026, 9, 1),
                end=date(2026, 9, 30),
                comparison_start=date(2026, 8, 2),
                comparison_end=date(2026, 8, 31),
                label="sep",
            ),
        ),
    )
    denied = client.post(
        "/api/insights/ins-1/feedback",
        json={"feedback": "helpful"},
        headers={"Authorization": "Bearer local.user-2"},
    )
    assert denied.status_code == 404
    allowed = client.post(
        "/api/insights/ins-1/feedback",
        json={"feedback": "helpful"},
        headers={"Authorization": f"Bearer local.{user_id}"},
    )
    assert allowed.status_code == 200
