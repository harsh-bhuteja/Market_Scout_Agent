# Scenario 3 — Stress Batching & Large Dataset: Senior ML Research Engineer (>500 Postings)

## 1. Scenario Overview
This scenario stresses the agent's **large-result-set batching strategy** (PRD Step 5 & Step 7 edge cases).

When processing hundreds of postings (exceeding 500 postings), sending all postings to an LLM at once overflows context windows, causes token rate limits, and results in hallucinated aggregations. The agent implements LangGraph's `Send` API to divide postings into discrete batches (e.g. 40 postings per batch), analyzes them concurrently, and merges the partial results using an explicit state reducer before computing final deterministic statistics.

---

## 2. Exact Input
From `samples/03-stress-batching/input.json`:
- **Role:** `Senior ML Research Engineer`
- **Location:** `San Francisco, CA`
- **Currency:** `USD`
- **Seniority:** `Senior`
- **Target Postings:** `520`
- **Batch Size:** `40`
- **Focus:** `market`
- **Client Purpose:** High-volume market mapping for AI/ML engineering across Silicon Valley tech employers.

---

## 3. How to Launch This Scenario

### Option A — Standalone CLI
Run from repository root:
```bash
python run_scout.py --role "Senior ML Research Engineer" --location "San Francisco, CA" --currency USD --focus market --batch-size 40 --min-postings 50 --out-dir ./samples/03-stress-batching
```

### Option B — Web Dashboard UI
1. Navigate to `http://localhost:3000`
2. Select the **Senior ML Research Engineer** preset card on the Command Center.
3. Review the search plan and approve execution.
4. Monitor the live progress events in the visualizer showing batch processing (`analyze_batch`).

---

## 4. Expected Graph Behavior
1. **Intake & Plan:** Role and location are specific (`Senior ML Research Engineer`, `San Francisco, CA`). Clarification is bypassed; search plan drafts target postings and queries.
2. **Search Plan Approval:** Operator reviews and approves plan.
3. **Retrieval & Deduplication:** Tool fetches postings across pages and deduplicates by posting ID and title/company hashes.
4. **Sufficiency Check:** Verifies sufficient posting count. Passes condition `sufficient=True`.
5. **Parallel Map-Reduce via LangGraph `Send`:**
   - Conditional router returns a list of `Send("analyze_batch", {"batch_id": i, "postings": chunk})` objects.
   - For 520 postings and a `batch_size=40`, exactly 13 parallel branch tasks are dispatched.
   - Each batch extracts normalized skills, salary data, and employer occurrences.
6. **State Reduction:** LangGraph reducer merges all batch outputs in state (`batch_analyses: Annotated[list, operator.add]`).
7. **Synthesis & Report:** Python calculates exact population metrics (median, IQR, disclosure %, employer direct vs agency split). Pydantic produces final market brief.

---

## 5. Expected HITL Interactions
- **Clarification:** **SKIPPED** (Senior ML Research Engineer in San Francisco is clear).
- **Search Plan Review:** **PAUSED**. Review plan and enter `a` to approve.
- **Low Data Checkpoint:** Skipped (high-volume query yields abundant postings).

---

## 6. Expected Output Artifacts
When executed, the runner automatically outputs to `./samples/03-stress-batching/`:
- `brief.json`: Pydantic brief with comprehensive metrics derived from the complete large dataset.
- `brief.md`: Detailed Markdown brief including salary distribution, lead skills (e.g. PyTorch, TensorFlow, CUDA, distributed training), and top employers.
- `transcript.json`: Audit transcript recording intake, plan approval, and batch analysis summary.
- `routing_trace.json`: Detailed routing trace confirming:
  - Total raw postings fetched
  - Duplicates removed
  - Number of parallel batches processed via `Send`
  - Sample posting IDs cited in findings

---

## 7. Pass / Fail Acceptance Criteria

| Check | PASS Condition | FAIL Condition |
|---|---|---|
| **Context Window Safety** | Postings are processed in chunks via `Send`; no single node payload exceeds LLM limit. | Giant JSON string dumped into a single prompt leading to truncation or rate limits. |
| **Map-Reduce Consistency** | All batch results are collected by reducer into state and aggregated. | Batches dropped, lost, or overwritten in state. |
| **Deterministic Aggregations** | Median and IQR are mathematically calculated over all valid disclosed salaries; no hallucinated percentiles. | Percentiles fabricated or missing when salary data exists. |
| **Skills Normalization** | Skill aliases like `PyTorch` / `pytorch` or `PostgreSQL` / `Postgres` are deduplicated and counted once. | Duplicate entries for the same skill in must-have list. |
| **Trace Verification** | `routing_trace.json` shows batch count and total postings analyzed matching the volume fetched. | Trace missing batch breakdown or showing serial single-batch run. |

