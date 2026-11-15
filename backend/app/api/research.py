from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, get_db
from app.db import ResearchRunRecord, User
from app.engine import get_runner

router = APIRouter(tags=["research"])


class HiringRequestBody(BaseModel):
    id: str | None = None
    role: str
    location: str
    experienceRange: str = ""
    industry: str = ""
    seniority: str = "Any"
    workplaceType: str = "Any"
    employmentType: str = "Any"
    currency: str = "USD"
    clientPurpose: str = ""
    focusAreas: list[str] = []
    createdAt: str | None = None


class ResumeBody(BaseModel):
    type: str | None = None
    answers: dict | None = None
    plan: dict | None = None
    searchPlan: dict | None = None
    action: str | None = None
    decision: str | None = None


def _save_status(db: Session, run: ResearchRunRecord, snapshot: dict) -> None:
    run.status = snapshot.get("status") or run.status
    run.updated_at = datetime.now(timezone.utc)
    if snapshot.get("error"):
        run.error = snapshot["error"]
    if snapshot.get("briefId"):
        run.brief_id = snapshot["briefId"]
    db.commit()


def _run_or_404(db: Session, run_id: str, user: User) -> ResearchRunRecord:
    run = db.get(ResearchRunRecord, run_id)
    if not run or run.user_id != user.id:
        raise HTTPException(status_code=404, detail="Research run not found")
    return run


@router.post("/api/research")
@router.post("/api/research/start")
def start_research(
    body: HiringRequestBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    run_id = body.id or f"run-{uuid.uuid4().hex[:12]}"
    payload = body.model_dump()
    payload["id"] = run_id
    payload["createdAt"] = payload.get("createdAt") or datetime.now(timezone.utc).isoformat()
    record = ResearchRunRecord(
        id=run_id,
        user_id=user.id,
        role=body.role,
        location=body.location,
        status="in_progress",
        request_json=json.dumps(payload),
    )
    db.add(record)
    db.commit()
    snapshot = get_runner().start(run_id, payload)
    _save_status(db, record, snapshot)
    return {
        "runId": run_id,
        "initialStageId": snapshot.get("currentStageId") or 1,
        "run": snapshot,
    }


@router.get("/api/research")
@router.get("/api/research/runs")
def list_research(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(ResearchRunRecord)
        .filter(ResearchRunRecord.user_id == user.id)
        .order_by(ResearchRunRecord.created_at.desc())
        .all()
    )
    out = []
    runner = get_runner()
    for row in rows:
        try:
            snap = runner.snapshot(row.id)
            out.append(_history_item(row, snap))
        except Exception:
            out.append(_history_item(row, None))
    return out


@router.get("/api/research/{run_id}")
@router.get("/api/research/runs/{run_id}")
def get_research(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _run_or_404(db, run_id, user)
    try:
        snapshot = get_runner().snapshot(run_id)
        _save_status(db, row, snapshot)
        return snapshot
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Run state not found: {exc}") from exc


@router.post("/api/research/{run_id}/resume")
def resume_research(
    run_id: str,
    body: ResumeBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _run_or_404(db, run_id, user)
    payload: dict | str
    if body.answers is not None:
        payload = body.answers
    elif body.plan or body.searchPlan:
        payload = {"plan": body.plan or body.searchPlan}
    elif body.action or body.decision:
        payload = {"action": body.action or body.decision}
    else:
        payload = body.model_dump(exclude_none=True)
    snapshot = get_runner().resume(run_id, payload)
    _save_status(db, row, snapshot)
    if snapshot.get("status") == "failed":
        raise HTTPException(status_code=502, detail=snapshot.get("error") or "Research run failed")
    return snapshot


@router.get("/api/research/{run_id}/report")
@router.get("/api/briefs/{brief_id}")
def get_report(
    run_id: str | None = None,
    brief_id: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target = run_id or brief_id or ""
    lookup_id = target
    if target.startswith("brief-"):
        lookup_id = target.replace("brief-", "", 1)
    row = db.get(ResearchRunRecord, lookup_id)
    if not row or row.user_id != user.id:
        # also allow brief id stored on row
        row = (
            db.query(ResearchRunRecord)
            .filter(ResearchRunRecord.user_id == user.id, ResearchRunRecord.brief_id == target)
            .first()
        )
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    snapshot = get_runner().snapshot(row.id)
    if not snapshot.get("report"):
        raise HTTPException(status_code=409, detail="Report is not ready")
    return snapshot["report"]


@router.get("/api/research/{run_id}/events")
def research_events(run_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _run_or_404(db, run_id, user)

    def gen():
        snapshot = get_runner().snapshot(run_id)
        for log in snapshot.get("logs") or []:
            yield f"data: {json.dumps(log)}\n\n"
        yield f"data: {json.dumps({'type': 'status', 'status': snapshot.get('status')})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/api/research/{run_id}/export")
def export_research_artifacts(
    run_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from services.markdown import brief_to_markdown

    row = _run_or_404(db, run_id, user)
    snapshot = get_runner().snapshot(row.id)
    report = snapshot.get("report")
    if not report:
        raise HTTPException(status_code=409, detail="Report is not ready for export")

    logs = snapshot.get("logs") or []
    req_json = {}
    try:
        req_json = json.loads(row.request_json) if row.request_json else {}
    except Exception:
        pass

    transcript = [
        {"event": "intake_initialized", "timestamp": row.created_at.isoformat(), "request": req_json},
    ]
    for log in logs:
        if log.get("type") in ("hitl", "checkpoint", "clarification", "approval"):
            transcript.append({"event": log.get("type"), "timestamp": log.get("timestamp"), "text": log.get("text")})
    transcript.append({"event": "completed", "summary": report.get("summary")})

    routing_trace = {
        "threadId": row.id,
        "status": snapshot.get("status"),
        "role": row.role,
        "location": row.location,
        "currentStageId": snapshot.get("currentStageId"),
        "logs": logs,
    }

    return {
        "brief": report,
        "markdown": brief_to_markdown(report),
        "transcript": transcript,
        "routingTrace": routing_trace,
    }


def _history_item(row: ResearchRunRecord, snap: dict | None) -> dict:
    if snap:
        return {
            "id": row.id,
            "role": snap.get("role") or row.role,
            "location": snap.get("location") or row.location,
            "createdAt": row.created_at.isoformat(),
            "status": snap.get("status") or row.status,
            "currentStageId": snap.get("currentStageId") or 1,
            "hiringOutlook": snap.get("hiringOutlook"),
            "totalPostingsIndexed": snap.get("totalPostingsIndexed"),
            "salaryMedian": snap.get("salaryMedian"),
            "currency": snap.get("currency"),
            "briefId": snap.get("briefId") or row.brief_id or None,
            "hitlPending": snap.get("hitlPending"),
        }
    return {
        "id": row.id,
        "role": row.role,
        "location": row.location,
        "createdAt": row.created_at.isoformat(),
        "status": row.status,
        "currentStageId": 1,
        "briefId": row.brief_id or None,
        "hitlPending": row.status == "paused",
    }
