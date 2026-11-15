# Scenario 2 — Ambiguous Role & Broad Geography: Engineer (Texas)

## 1. Scenario Overview
This scenario stresses the agent's **ambiguity detection and clarification checkpoint** (PRD Step 2).

"Engineer" is overly broad (Software, Civil, Electrical, Mechanical, DevOps?) and "Texas" spans multiple distinct labor markets (Austin, Dallas-Fort Worth, Houston, San Antonio). The agent must detect ambiguity, pause execution, present targeted questions with structured options, and resume on the same thread without data loss.

---

## 2. Exact Input
From `samples/02-ambiguous-role/input.json`:
- **Role:** `Engineer`
- **Location:** `Texas`
- **Currency:** `USD`
- **Seniority:** `Senior`
- **Focus:** `skills`
- **Client Purpose:** Exploring general engineering talent availability across Texas tech corridors.

---

## 3. How to Launch This Scenario

### Option A — Standalone CLI
Run from repository root:
```bash
python run_scout.py --role "Engineer" --location "Texas" --currency USD --focus skills --out-dir ./samples/02-ambiguous-role
```

### Option B — Web Dashboard UI
1. Navigate to `http://localhost:3000`
2. Select the **Software Engineer / HITL Checkpoints** preset card or click **Start New Market Scout**.
3. Input role as `Engineer` and location as `Texas`.
4. Submit the request.

---

## 4. Expected Graph Behavior
1. **Intake Node:** Analyzes token length and specificity. Identifies `Engineer` as ambiguous (lacks specialization) and `Texas` as an entire state.
2. **Clarification Checkpoint (HITL #1):** Conditional edge routes to `clarification` node. LangGraph executes `interrupt()` containing 1–3 structured questions.
3. **Operator Interaction:** The graph thread halts in SQLite. The operator answers the questions (e.g. selecting "Software / Distributed Systems" and "Austin Metro").
4. **Resumption:** Graph resumes via `Command(resume={"answers": ...})` on the identical `thread_id`. State incorporates answers into `clarification_answers`.
5. **Search Plan Generation & Approval:** Uses clarification answers to construct precise query terms (`Software Engineer`, `Backend Engineer`, `Distributed Systems`, location radius: Austin, TX). Pauses at `plan_approval`.
6. **Execution & Report Generation:** Fetches postings, computes skills (must-have vs nice-to-have), salary percentiles, and writes final market brief.

---

## 5. Expected HITL Interactions
- **Clarification:** **PAUSED** (Must occur).
  - CLI: Prompts with Question 1 (discipline/track) and Question 2 (target metro/work mode). Enter `1` or custom answer.
  - UI: `ClarificationModal` appears with radio buttons and text options. Select preferred options and click **Submit Clarifications & Proceed**.
- **Search Plan Review:** **PAUSED** (Must occur after clarification).
  - Verify that the updated search plan reflects the operator's clarification answers (e.g. Austin area, software titles).
  - Approve to continue.

---

## 6. Expected Output Artifacts
When executed, the runner automatically outputs to `./samples/02-ambiguous-role/`:
- `brief.json`: Pydantic-validated brief for the clarified role and metro.
- `brief.md`: Formatted client Markdown brief.
- `transcript.json`: Detailed interaction transcript documenting:
  1. Original ambiguous input (`Engineer, Texas`)
  2. Targeted questions asked by agent
  3. Answers provided by operator
  4. Updated search plan and approval timestamp
- `routing_trace.json`: Step-by-step routing log showing `intake -> clarification [PAUSED] -> clarification [RESUMED] -> search_plan -> plan_approval [PAUSED] -> ... -> report`.

---

## 7. Pass / Fail Acceptance Criteria

| Check | PASS Condition | FAIL Condition |
|---|---|---|
| **Ambiguity Detection** | Graph pauses at `clarification` node before any search plan or API fetch. | Graph proceeds straight to job search on "Engineer, Texas". |
| **State Persistence** | Resuming with answers keeps the same `thread_id` in SQLite; no restart from scratch. | Thread lost or resets back to stage 1 upon answer submission. |
| **Search Plan Alignment** | Search plan adopts clarified title variants and localized metro scope. | Search plan searches generic "Engineer" across entire state of Texas. |
| **Transcript Accuracy** | `transcript.json` records the exact questions asked and answers submitted. | Transcript is empty or omits the Q&A exchange. |
| **Report Relevance** | Output brief reflects the refined specialization and provides evidence-backed insights. | Report is generic or hallucinates compensation. |

