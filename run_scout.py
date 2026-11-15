#!/usr/bin/env python3
"""Market Scout Agent — Standalone CLI Runner

Executes the stateful LangGraph Talent Market Scout research workflow
with full support for Human-in-the-Loop (HITL) checkpoints:
  1. Clarification pause (ambiguous hiring requests)
  2. Search-plan approval & editing pause
  3. Low-data sufficiency decision pause

Outputs generated:
  - brief.json
  - brief.md
  - transcript.json
  - routing_trace.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure backend and ai-service are in sys.path
ROOT = Path(__file__).resolve().parent
for p in (ROOT / "backend", ROOT / "ai-service"):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

from graph.runner import ResearchGraphRunner
from services.llm import LLMClient
from services.markdown import brief_to_markdown
from tools.adzuna import AdzunaClient, configure_adzuna_client


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python run_scout.py",
        description="Joveo Talent Market Scout Agent — Autonomous AI Research CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Standard clear request (skips clarification pause):
  python run_scout.py --role "Data Analyst" --location "Bangalore" --focus salary

  # Ambiguous request (triggers clarification pause):
  python run_scout.py --role "Engineer" --location "Texas"

  # Custom output directory and batch size:
  python run_scout.py --role "Senior ML Research Engineer" --location "San Francisco" --out-dir ./output/ml-run
        """,
    )
    parser.add_argument("--role", "-r", type=str, help="Target role or job title (e.g. 'Data Analyst')")
    parser.add_argument("--location", "-l", type=str, help="Target location/metro (e.g. 'Bangalore, India')")
    parser.add_argument(
        "--focus",
        "-f",
        type=str,
        default="",
        choices=["", "salary", "skills", "market", "competition"],
        help="Optional analytical focus flag (--focus salary | --focus skills | --focus market)",
    )
    parser.add_argument("--seniority", type=str, default="Any", help="Seniority level (e.g. Entry, Mid, Senior, Lead)")
    parser.add_argument("--employment-type", type=str, default="Any", help="Employment type (Full-time, Contract, etc.)")
    parser.add_argument("--workplace-type", type=str, default="Any", help="Workplace mode (On-site, Hybrid, Remote)")
    parser.add_argument("--currency", type=str, default="USD", help="Target currency code (USD, INR, GBP, EUR)")
    parser.add_argument("--client-purpose", type=str, default="", help="Client purpose or context for the campaign")
    parser.add_argument("--out-dir", "-o", type=str, default="", help="Output directory for generated briefs and traces")
    parser.add_argument("--checkpoint-path", type=str, default="", help="Path to SQLite checkpoint database")
    parser.add_argument("--min-postings", type=int, default=20, help="Minimum postings threshold before triggering sufficiency loop")
    parser.add_argument("--batch-size", type=int, default=40, help="Batch size for LangGraph Send map-reduce analysis")
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Auto-approve default recommendations during HITL checkpoints without terminal prompts",
    )
    return parser.parse_args(argv)


def prompt_clarification(questions: list[dict], non_interactive: bool = False) -> dict[str, str]:
    print("\n" + "=" * 65)
    print(" [HITL CHECKPOINT 1] Clarification Needed for Ambiguous Role/Location")
    print("=" * 65)
    answers: dict[str, str] = {}
    for i, q in enumerate(questions, 1):
        qid = q.get("id") or f"q{i}"
        question_text = q.get("question", "")
        context = q.get("context", "")
        suggested = q.get("suggestedAnswers") or []

        print(f"\nQuestion {i}: {question_text}")
        if context:
            print(f"Context: {context}")
        if suggested:
            print("Suggested options:")
            for idx, opt in enumerate(suggested, 1):
                print(f"  [{idx}] {opt}")

        if non_interactive:
            choice = suggested[0] if suggested else "Default answer"
            print(f"-> Auto-selected: {choice}")
            answers[qid] = choice
            continue

        prompt_str = "Your answer (number or custom text): "
        user_input = input(prompt_str).strip()
        if user_input.isdigit() and 1 <= int(user_input) <= len(suggested):
            answers[qid] = suggested[int(user_input) - 1]
        elif user_input:
            answers[qid] = user_input
        else:
            answers[qid] = suggested[0] if suggested else ""
        print(f"-> Selected: {answers[qid]}")
    return answers


def prompt_search_plan(plan: dict, non_interactive: bool = False) -> dict:
    print("\n" + "=" * 65)
    print(" [HITL CHECKPOINT 2] Search Plan Review & Approval")
    print("=" * 65)
    role_name = plan.get('roleQuery') or plan.get('targetRole') or 'N/A'
    location_name = plan.get('locationScope') or 'N/A'
    radius = plan.get('radiusKm') or plan.get('radiusMiles', 35)
    synonyms = plan.get('titleSynonyms') or plan.get('titleVariants') or []
    keywords = plan.get('keywords') or plan.get('skillKeywords') or []
    target = plan.get('targetPostingsCount') or plan.get('targetPostings', 50)

    print(f"Target Role:       {role_name}")
    print(f"Location Scope:    {location_name} (Radius: {radius} km)")
    print(f"Title Synonyms:    {', '.join(synonyms)}")
    print(f"Skill Keywords:    {', '.join(keywords)}")
    print(f"Target Postings:   {target}")
    print("-" * 65)

    if non_interactive:
        print("-> Auto-approved search plan.")
        return plan

    while True:
        choice = input("\nAction: [A]pprove / [E]dit / [Q]uit: ").strip().lower()
        if choice in ("a", "approve", "y", "yes", ""):
            print("-> Search plan approved. Proceeding to job retrieval.")
            return plan
        elif choice in ("q", "quit", "exit"):
            print("Execution aborted by operator.")
            sys.exit(0)
        elif choice in ("e", "edit"):
            print("Editing search plan:")
            new_role = input(f"Target role [{role_name}]: ").strip()
            if new_role:
                plan["roleQuery"] = new_role
                plan["targetRole"] = new_role
            new_variants = input(f"Title variants (comma-separated) [{', '.join(synonyms)}]: ").strip()
            if new_variants:
                vars_list = [v.strip() for v in new_variants.split(",") if v.strip()]
                plan["titleSynonyms"] = vars_list
                plan["titleVariants"] = vars_list
            new_radius = input(f"Radius km [{radius}]: ").strip()
            if new_radius.isdigit():
                plan["radiusKm"] = int(new_radius)
            print("-> Updated search plan saved.")
            return plan


def prompt_low_data(checkpoint: dict, non_interactive: bool = False) -> dict:
    print("\n" + "=" * 65)
    print(" [HITL CHECKPOINT 3] Low Data / Insufficient Postings Checkpoint")
    print("=" * 65)
    msg = checkpoint.get("message") or "Current retrieved sample is below the sufficiency threshold."
    print(msg)
    options = [
        ("broaden_radius", "Broaden search radius and expand location boundary"),
        ("add_synonyms", "Expand title synonyms and adjacent role keywords"),
        ("proceed_with_sparse", "Proceed with current sparse sample"),
    ]
    for idx, (code, label) in enumerate(options, 1):
        print(f"  [{idx}] {label}")

    if non_interactive:
        print("-> Auto-selected: proceed_with_sparse")
        return {"action": "proceed_with_sparse"}

    user_input = input("\nSelect action [1-3] (default 3): ").strip()
    if user_input == "1":
        return {"action": "broaden_radius"}
    elif user_input == "2":
        return {"action": "add_synonyms"}
    return {"action": "proceed_with_sparse"}


def save_artifacts(out_dir: Path, report: dict, transcript: list[dict], routing_trace: dict) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    brief_json_path = out_dir / "brief.json"
    with open(brief_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    brief_md_path = out_dir / "brief.md"
    markdown_content = brief_to_markdown(report)
    with open(brief_md_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    transcript_path = out_dir / "transcript.json"
    with open(transcript_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, indent=2, ensure_ascii=False)

    trace_path = out_dir / "routing_trace.json"
    with open(trace_path, "w", encoding="utf-8") as f:
        json.dump(routing_trace, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(" ARTIFACTS GENERATED SUCCESSFULLY")
    print("=" * 65)
    print(f"  • JSON Brief:     {brief_json_path}")
    print(f"  • Markdown Brief: {brief_md_path}")
    print(f"  • Transcript:     {transcript_path}")
    print(f"  • Routing Trace:  {trace_path}")
    print("=" * 65)


def run_scout_cli(args: argparse.Namespace) -> int:
    role = args.role
    location = args.location
    if not role:
        role = input("Enter target role or job title (e.g. Data Analyst): ").strip()
    if not location:
        location = input("Enter target location (e.g. Bangalore, India): ").strip()

    if not role or not location:
        print("Error: Role and Location are required.", file=sys.stderr)
        return 1

    app_id = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")
    if not app_id or not app_key or "your-" in app_id:
        print("\n[WARNING] Adzuna credentials are not configured or contain placeholder values.", file=sys.stderr)
        print("Set ADZUNA_APP_ID and ADZUNA_APP_KEY in backend/.env before running real job searches.", file=sys.stderr)

    checkpoint_db = (
        args.checkpoint_path
        or os.getenv("CHECKPOINT_PATH")
        or str(ROOT / "backend" / "data" / "checkpoints.db")
    )
    Path(checkpoint_db).parent.mkdir(parents=True, exist_ok=True)

    run_id = f"cli-{uuid.uuid4().hex[:10]}"
    out_dir_path = Path(args.out_dir) if args.out_dir else (ROOT / "output" / run_id)

    adzuna = AdzunaClient(app_id=app_id, app_key=app_key)
    configure_adzuna_client(adzuna)

    llm_api_key = os.getenv("LLM_API_KEY", "")
    llm_model = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")
    llm_base_url = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    llm_fallback = os.getenv("LLM_FALLBACK_MODEL", "openai/gpt-oss-20b")
    llm = LLMClient(
        model=llm_model,
        api_key=llm_api_key,
        base_url=llm_base_url,
        fallback_model=llm_fallback or None,
    )

    runner = ResearchGraphRunner(
        checkpoint_path=checkpoint_db,
        adzuna=adzuna,
        llm=llm,
        min_postings=args.min_postings,
        max_fetch_attempts=2,
        batch_size=args.batch_size,
    )

    request_payload = {
        "id": run_id,
        "role": role,
        "location": location,
        "seniority": args.seniority,
        "employmentType": args.employment_type,
        "workplaceType": args.workplace_type,
        "currency": args.currency,
        "clientPurpose": args.client_purpose,
        "focusAreas": [args.focus] if args.focus else [],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    transcript: list[dict] = [
        {
            "event": "intake_initialized",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request": request_payload,
        }
    ]

    print(f"\n[INFO] Starting Market Scout Agent for '{role}' in '{location}'...")
    print(f"[INFO] Thread ID: {run_id}")
    print(f"[INFO] Checkpoint DB: {checkpoint_db}")

    snapshot = runner.start(run_id, request_payload)

    # Main HITL loop
    while snapshot.get("status") == "paused":
        checkpoint = snapshot.get("checkpoint") or {}
        ckpt_type = checkpoint.get("type")

        if ckpt_type == "clarification":
            questions = checkpoint.get("clarificationQuestions") or []
            answers = prompt_clarification(questions, non_interactive=args.non_interactive)
            transcript.append({
                "event": "clarification_answered",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "questions": questions,
                "answers": answers,
            })
            print("[INFO] Resuming graph with clarification answers...")
            snapshot = runner.resume(run_id, {"answers": answers})

        elif ckpt_type == "search_plan_approval":
            plan = checkpoint.get("searchPlanDraft") or {}
            approved_plan = prompt_search_plan(plan, non_interactive=args.non_interactive)
            transcript.append({
                "event": "search_plan_approved",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "initialPlan": plan,
                "approvedPlan": approved_plan,
            })
            print("[INFO] Resuming graph with approved search plan...")
            snapshot = runner.resume(run_id, {"plan": approved_plan})

        elif ckpt_type in ("low_data", "low_data_decision"):
            decision = prompt_low_data(checkpoint, non_interactive=args.non_interactive)
            transcript.append({
                "event": "low_data_decision",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "decision": decision,
            })
            print(f"[INFO] Resuming graph with low-data action: {decision}...")
            snapshot = runner.resume(run_id, decision)

        else:
            print(f"[WARNING] Unrecognized pause type: {ckpt_type}. Aborting.")
            break

    if snapshot.get("status") == "failed":
        print(f"\n[ERROR] Research workflow failed: {snapshot.get('error')}", file=sys.stderr)
        return 1

    report = snapshot.get("report")
    if not report:
        print("\n[ERROR] Workflow completed but no report was generated.", file=sys.stderr)
        return 1

    routing_trace = {
        "threadId": run_id,
        "status": snapshot.get("status"),
        "role": role,
        "location": location,
        "currentStageId": snapshot.get("currentStageId"),
        "logs": snapshot.get("logs") or [],
        "completedAt": datetime.now(timezone.utc).isoformat(),
    }

    transcript.append({
        "event": "completed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": report.get("summary"),
        "hiringOutlook": report.get("hiringOutlook"),
    })

    save_artifacts(out_dir_path, report, transcript, routing_trace)

    # Print summary highlights
    outlook = report.get("hiringOutlook") or {}
    comp = report.get("compensation") or {}
    print("\n" + "=" * 65)
    print(" TALENT MARKET BRIEF SUMMARY")
    print("=" * 65)
    print(f"Role / Location:   {report.get('role')} — {report.get('location')}")
    print(f"Hiring Outlook:    {outlook.get('verdict')} ({outlook.get('reason')})")
    print(f"Median Salary:     {comp.get('currency')} {comp.get('medianSalary')}")
    print(f"Salary IQR:        {comp.get('percentile25')} – {comp.get('percentile75')}")
    print(f"Disclosure Rate:   {comp.get('disclosedPayPercentage')}%")
    print(f"Summary:           {report.get('summary')}")
    print("=" * 65 + "\n")
    return 0


if __name__ == "__main__":
    cli_args = parse_args()
    sys.exit(run_scout_cli(cli_args))

