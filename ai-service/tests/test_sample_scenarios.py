from __future__ import annotations

import json
from pathlib import Path

import sys
from pathlib import Path
_TESTS_DIR = str(Path(__file__).resolve().parent)
if _TESTS_DIR not in sys.path:
    sys.path.insert(0, _TESTS_DIR)

from helpers import adzuna_handler_factory, build_runner, make_job

SAMPLES = Path(__file__).resolve().parents[2] / "samples" / "fixture-runs"


def _write(name: str, content: str):
    SAMPLES.mkdir(parents=True, exist_ok=True)
    (SAMPLES / name).write_text(content, encoding="utf-8")


def test_scenario_ambiguous_and_high_volume(tmp_path):
    SAMPLES.mkdir(parents=True, exist_ok=True)
    runner = build_runner(str(tmp_path / "c.db"), adzuna_handler_factory({1: [make_job(i) for i in range(30)]}), min_postings=5)
    snap = runner.start("sample-amb", {"role": "Engineer", "location": "Texas", "currency": "USD"})
    transcript = [{"pause": "clarification", "questions": snap["checkpoint"]["clarificationQuestions"]}]
    answers = {"q1": "Backend Software Engineering (Distributed Systems)", "q2": "Austin Metro (Hybrid)"}
    snap = runner.resume("sample-amb", answers)
    transcript.append({"resume_answers": answers, "next": snap["checkpoint"]["type"]})
    snap = runner.resume("sample-amb", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    transcript.append({"status": snap["status"], "postings": snap["totalPostingsIndexed"]})
    _write("02-ambiguous-clarification.json", json.dumps(snap["report"], indent=2))
    _write("02-ambiguous-clarification.md", snap["reportMarkdown"])
    _write("02-ambiguous-transcript.json", json.dumps(transcript, indent=2))
    _write("02-SOURCE.txt", "DETERMINISTIC FIXTURE RUN — mocked Adzuna, not a live API sample.\n")

    big = [make_job(i, title=f"Data Analyst {i}") for i in range(520)]
    runner2 = build_runner(str(tmp_path / "c2.db"), adzuna_handler_factory({1: big}), min_postings=10, batch_size=40)
    snap = runner2.start("sample-stress", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner2.resume("sample-stress", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    trace = {
        "postings": snap["totalPostingsIndexed"],
        "batches": 13,
        "status": snap["status"],
        "postingIds": [f"adz-{1000+i}" for i in range(min(20, snap["totalPostingsIndexed"]))],
    }
    _write("03-high-volume-batching.json", json.dumps(snap["report"], indent=2))
    _write("03-high-volume-batching.md", snap["reportMarkdown"])
    _write("03-high-volume-trace.json", json.dumps(trace, indent=2))
    _write("03-SOURCE.txt", "DETERMINISTIC FIXTURE RUN — 520 mocked postings to exercise LangGraph Send batching.\n")
    assert snap["totalPostingsIndexed"] == 520
