# Scenario 1 — Clear Role & Location: Data Analyst (Bangalore)

## 1. Scenario Overview
This scenario evaluates the agent's behavior when provided with an unambiguous, specific role and well-defined tech hub location (`Data Analyst`, `Bangalore, India`).

The primary assessment criterion is verifying that **clarification is skipped** (no unnecessary human friction), the search plan is drafted and paused for operator approval, and a full evidence-backed market brief is produced.

---

## 2. Exact Input
From `samples/01-clear-role/input.json`:
- **Role:** `Data Analyst`
- **Location:** `Bangalore, India`
- **Currency:** `INR`
- **Seniority:** `Entry-Mid`
- **Employment Type:** `Full-time`
- **Workplace Type:** `Hybrid`
- **Focus:** `salary`
- **Client Purpose:** Expanding data analytics team across tech hub operations in Bangalore.

---

## 3. How to Launch This Scenario

### Option A — Standalone CLI
Run from repository root:
```bash
python run_scout.py --role "Data Analyst" --location "Bangalore, India" --currency INR --focus salary --out-dir ./samples/01-clear-role
```

### Option B — Web Dashboard UI
1. Start backend: `cd backend && uvicorn app.main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:3000` and click the **Data Analyst** preset card on the Command Center or click **Start New Market Scout**.
4. Enter `Data Analyst` and `Bangalore, India` (Currency: INR).

---

## 4. Expected Graph Behavior
1. **Intake Node:** Ingests the hiring request and computes ambiguity scores.
2. **Clarification Decision (Conditional Edge):** Since both role and location are specific, `needs_clarification` is evaluated as `False`. The graph routes directly to `search_plan` without triggering `interrupt()`.
3. **Search Plan Drafting:** Creates title variants (`Data Analyst`, `Analytics Specialist`, `Business Data Analyst`), skill keywords (`SQL`, `Python`, `Tableau`, `Power BI`), and search radius.
4. **Search Plan Approval (HITL Checkpoint #2):** Graph pauses with `interrupt({"type": "search_plan_approval", ...})`.
5. **Execution & Synthesis:** Upon operator approval, Adzuna tool fetches postings, dedupes them, runs parallel batch analysis, computes deterministic stats (INR median, IQR, disclosure rate, must-have skills), and generates the structured report.

---

## 5. Expected HITL Interactions
- **Clarification:** **SKIPPED** (No clarification prompt or modal should appear).
- **Search Plan Review:** **PAUSED**.
  - In CLI: Terminal displays the search plan and prompts `[A]pprove / [E]dit / [Q]uit`. Enter `a` to approve.
  - In UI: Search Plan Modal opens. Click **Approve & Start Gathering Postings**.
- **Low Data Checkpoint:** Skipped if retrieved postings meet threshold (`min_postings=20`).

---

## 6. Expected Output Artifacts
When executed, the runner automatically outputs to `./samples/01-clear-role/`:
- `brief.json`: Pydantic-validated JSON brief containing summary, compensation percentiles, skills, employer splits, and confidence insights.
- `brief.md`: Formatted client-ready Markdown report.
- `transcript.json`: Full transcript documenting that clarification was skipped and search plan was approved.
- `routing_trace.json`: Node-by-node execution log showing `intake -> search_plan -> plan_approval -> plan_adzuna_calls -> tools -> ingest_postings -> sufficiency -> synthesize -> report`.

---

## 7. Pass / Fail Acceptance Criteria

| Check | PASS Condition | FAIL Condition |
|---|---|---|
| **Clarification Bypass** | Graph immediately transitions to search plan without asking questions. | Graph pauses for clarification questions on "Data Analyst, Bangalore". |
| **Search Plan Pause** | Graph halts execution and presents search plan for approval. | API queries jobs before operator approves the plan. |
| **Compensation Quality** | Non-zero median in INR, 25th-75th percentiles (IQR), disclosure rate calculated. | Missing salary metrics or fabricated/guessed numbers. |
| **Evidence Grounding** | All confidence insights reference actual retrieved job IDs (`samplePostingIds`). | Insights lack posting IDs or reference hallucinated IDs. |
| **Artifact Generation** | All 4 files (`brief.json`, `brief.md`, `transcript.json`, `routing_trace.json`) are generated in the folder. | Any artifact missing or malformed JSON. |

