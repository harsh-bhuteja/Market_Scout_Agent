# Assessment Evaluation Scenarios & Manual Acceptance Testing Guide

This directory contains the three standardized evaluation scenarios required by the **Joveo Talent Market Scout Agent PRD (Pages 5–6)**:

1. **`01-clear-role/`** — Clear, common hiring request (`Data Analyst, Bangalore`). Clarification pause is bypassed; search-plan approval pause is triggered; generates final market brief.
2. **`02-ambiguous-role/`** — Ambiguous hiring request (`Engineer, Texas`). Triggers the human-in-the-loop clarification checkpoint; questions answered; search plan updated and approved; generates final brief.
3. **`03-stress-batching/`** — High-volume request (`Senior ML Research Engineer, San Francisco`, >500 postings). Stresses LangGraph `Send` parallel map-reduce batching, state reducer aggregation, and deterministic statistics.

---

## 1. Manual Acceptance Testing Protocol

To ensure 100% integrity and honest evaluation, **these three scenarios have not been pre-executed or fabricated**. They are prepared for manual execution and evaluation by the assessor / interviewer.

When you execute any scenario, the application automatically produces the four required deliverables inside that scenario's folder:
- **`brief.json`** — Machine-readable structured brief validated by Pydantic.
- **`brief.md`** — Readable Markdown brief ready for client presentation.
- **`transcript.json`** — Chronological record of all human-agent interactions (Q&A and approvals).
- **`routing_trace.json`** — Node-by-node execution log and routing decisions.

---

## 2. Prerequisites & Environment Setup

Before executing live scenarios with the Adzuna API:

1. Ensure Python dependencies are installed:
   ```bash
   cd backend
   .venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```
2. Verify credentials in `backend/.env`:
   ```bash
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_APP_KEY=your_adzuna_app_key
   # Optional: LLM credentials for qualitative commentary (deterministic stats work without it)
   LLM_API_KEY=your_api_key
   ```

---

## 3. Quick Execution Commands

### Scenario 1 — Clear Role (Bypasses Clarification)
```bash
python run_scout.py --role "Data Analyst" --location "Bangalore, India" --currency INR --focus salary --out-dir ./samples/01-clear-role
```

### Scenario 2 — Ambiguous Role (Triggers Clarification)
```bash
python run_scout.py --role "Engineer" --location "Texas" --currency USD --focus skills --out-dir ./samples/02-ambiguous-role
```

### Scenario 3 — Stress Batching (>500 Postings)
```bash
python run_scout.py --role "Senior ML Research Engineer" --location "San Francisco, CA" --currency USD --focus market --batch-size 40 --min-postings 50 --out-dir ./samples/03-stress-batching
```

---

## 4. Web Dashboard Execution (Alternative)

If you prefer testing via the interactive UI:
1. Start backend:
   ```bash
   cd backend && .venv\Scripts\uvicorn app.main:app --reload --port 8000
   ```
2. Start frontend:
   ```bash
   cd frontend && npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
4. Click any of the three **Assessment Evaluation Preset cards** on the Command Center dashboard to launch that scenario.
5. Answer checkpoints interactively in the modals and view real-time node progress.

