from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest

import sys
from pathlib import Path
_TESTS_DIR = str(Path(__file__).resolve().parent)
if _TESTS_DIR not in sys.path:
    sys.path.insert(0, _TESTS_DIR)

from helpers import adzuna_handler_factory, build_runner, make_job
from tools.adzuna import AdzunaClient, AdzunaError


def _jobs(n, **kw):
    return [make_job(i, **kw) for i in range(n)]


def test_clear_role_skips_clarification(tmp_checkpoint):
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: _jobs(30)}), min_postings=5)
    snap = runner.start("t-clear", {"role": "Data Analyst", "location": "Bangalore, India", "currency": "INR"})
    assert snap["status"] == "paused"
    assert snap["checkpoint"]["type"] == "search_plan_approval"
    assert snap["checkpoint"]["type"] != "clarification"


def test_ambiguous_role_pauses_for_clarification(tmp_checkpoint):
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: _jobs(30)}), min_postings=5)
    snap = runner.start("t-amb", {"role": "Engineer", "location": "Texas", "currency": "USD"})
    assert snap["status"] == "paused"
    assert snap["checkpoint"]["type"] == "clarification"
    questions = snap["checkpoint"]["clarificationQuestions"]
    assert 1 <= len(questions) <= 3


def test_clarification_resume_same_thread(tmp_checkpoint):
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: _jobs(30)}), min_postings=5)
    first = runner.start("t-resume", {"role": "Engineer", "location": "Texas", "currency": "USD"})
    assert first["checkpoint"]["type"] == "clarification"
    second = runner.resume(
        "t-resume",
        {"q1": "Backend Software Engineering (Distributed Systems)", "q2": "Austin Metro (Hybrid)"},
    )
    assert second["id"] == "t-resume"
    assert second["checkpoint"]["type"] == "search_plan_approval"


def test_search_plan_approval_and_edit(tmp_checkpoint):
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: _jobs(30)}), min_postings=5)
    snap = runner.start("t-plan", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    plan = dict(snap["checkpoint"]["searchPlanDraft"])
    plan["radiusKm"] = 50
    plan["titleSynonyms"] = plan["titleSynonyms"] + ["Analytics Engineer"]
    resumed = runner.resume("t-plan", {"plan": plan})
    assert resumed["status"] in ("in_progress", "completed", "paused")
    assert resumed["searchPlan"]["radiusKm"] == 50


def test_low_volume_retries_then_hitl(tmp_checkpoint):
    runner = build_runner(
        tmp_checkpoint,
        adzuna_handler_factory({1: _jobs(2), 2: _jobs(2)}),
        min_postings=20,
        max_fetch_attempts=2,
    )
    snap = runner.start("t-low", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-low", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["status"] == "paused"
    assert snap["checkpoint"]["type"] == "low_data_decision"
    assert snap["checkpoint"]["lowDataDecision"]["attemptsMade"] >= 2


def test_low_data_hitl_proceed(tmp_checkpoint):
    runner = build_runner(
        tmp_checkpoint,
        adzuna_handler_factory({1: _jobs(3)}),
        min_postings=50,
        max_fetch_attempts=1,
    )
    snap = runner.start("t-sparse", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-sparse", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["checkpoint"]["type"] == "low_data_decision"
    done = runner.resume("t-sparse", {"action": "proceed_with_sparse"})
    assert done["status"] == "completed"
    assert done["report"]["confidenceInsights"][0]["confidence"] == "Low"


def test_adzuna_parses_raw_metadata(tmp_checkpoint):
    jobs = [make_job(1, title="SQL Analyst")]
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: jobs}), min_postings=1)
    snap = runner.start("t-raw", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-raw", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["status"] == "completed"
    state = runner.graph.get_state(runner._config("t-raw"))
    posting = state.values["postings"][0]
    assert posting["source"] == "adzuna"
    assert posting["source_id"] == "1001"
    assert "raw" in posting and posting["raw"]["id"] == 1001


def test_pagination(tmp_checkpoint):
    pages = {1: _jobs(50), 2: [make_job(200 + i) for i in range(50)]}
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory(pages, count=100), min_postings=5)
    snap = runner.start("t-page", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    plan = snap["checkpoint"]["searchPlanDraft"]
    plan["targetPostingsCount"] = 100
    snap = runner.resume("t-page", {"plan": plan})
    assert snap["totalPostingsIndexed"] == 100


def test_deduplication(tmp_checkpoint):
    dupes = [make_job(1), make_job(1), make_job(2)]
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: dupes}), min_postings=1)
    snap = runner.start("t-dup", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-dup", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["totalPostingsIndexed"] == 2
    assert snap["report"]["runNotes"]["dedupedDuplicatesCount"] >= 1


def test_salary_analysis_and_missing_not_fabricated():
    from services.compensation import summarize_compensation

    postings = [
        {"id": "a", "salary_min": 100, "salary_max": 100, "currency": "USD", "contract_time": "year"},
        {"id": "b", "salary_min": 200, "salary_max": 200, "currency": "USD", "contract_time": "year"},
        {"id": "c", "salary_min": 300, "salary_max": 300, "currency": "USD", "contract_time": "year"},
        {"id": "d", "salary_min": None, "salary_max": None, "currency": "USD"},
        {"id": "e", "salary_min": 9999, "salary_max": 9999, "currency": "USD", "salary_is_predicted": True},
    ]
    stats = summarize_compensation(postings, "USD", {"USD": 1.0})
    assert stats["medianSalary"] == 200
    assert stats["percentile25"] == 100
    assert stats["percentile75"] == 300
    assert stats["sampleSize"] == 3
    assert stats["disclosedCount"] == 3
    assert stats["disclosedPayPercentage"] == 60.0


def test_mixed_currency_and_period_normalization():
    from services.compensation import summarize_compensation

    postings = [
        {"id": "a", "salary_min": 50, "salary_max": 50, "currency": "USD", "contract_time": "hour"},
        {"id": "b", "salary_min": 100000, "salary_max": 100000, "currency": "USD", "contract_time": "year"},
        {"id": "c", "salary_min": 10, "salary_max": 10, "currency": "EUR", "contract_time": "year"},
    ]
    stats = summarize_compensation(postings, "USD", {"USD": 1.0, "EUR": 0.5})
    # hourly 50 * 2080 = 104000; EUR 10 / 0.5 = 20 USD
    assert stats["sampleSize"] == 3
    assert 20 in [stats["salaryMin"], 20]
    assert stats["salaryMin"] == 20


def test_skill_normalization():
    from services.skills import normalize_skill, skill_frequencies

    assert normalize_skill("js") == "JavaScript"
    assert normalize_skill("power bi") == "Power BI"
    must, nice = skill_frequencies(
        [
            {"must_have_skills": ["SQL", "sql"], "nice_to_have_skills": ["dbt"], "skills": []},
            {"must_have_skills": ["SQL"], "nice_to_have_skills": ["snowflake"], "skills": []},
        ],
        2,
    )
    assert must[0]["name"] == "SQL"
    assert must[0]["frequency"] == 2


def test_large_dataset_batches(tmp_checkpoint):
    jobs = _jobs(520)
    runner = build_runner(
        tmp_checkpoint,
        adzuna_handler_factory({1: jobs}),
        min_postings=10,
        batch_size=40,
    )
    snap = runner.start("t-big", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-big", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["status"] == "completed"
    assert snap["totalPostingsIndexed"] == 520
    state = runner.graph.get_state(runner._config("t-big"))
    assert len(state.values["batch_analyses"]) == 520


def test_evidence_and_structured_report(tmp_checkpoint):
    runner = build_runner(tmp_checkpoint, adzuna_handler_factory({1: _jobs(25)}), min_postings=5)
    snap = runner.start("t-ev", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-ev", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    report = snap["report"]
    ids = {p["id"] for p in runner.graph.get_state(runner._config("t-ev")).values["postings"]}
    for insight in report["confidenceInsights"]:
        assert insight["evidencePostingCount"] >= 0
        for pid in insight["samplePostingIds"]:
            assert pid in ids
    assert snap["reportMarkdown"].startswith("# Talent Market Brief")
    assert report["summary"]


def test_provider_failure_no_fake_report(tmp_checkpoint):
    def fail(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "boom"})

    runner = build_runner(tmp_checkpoint, fail, min_postings=5, max_fetch_attempts=1)
    snap = runner.start("t-fail", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-fail", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["status"] == "failed"
    assert snap["report"] is None
    assert "Adzuna" in (snap["error"] or "")


def test_timeout_then_failure(tmp_checkpoint):
    def timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    runner = build_runner(tmp_checkpoint, timeout, min_postings=5, max_fetch_attempts=1)
    snap = runner.start("t-to", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    snap = runner.resume("t-to", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    assert snap["status"] == "failed"


def test_persistence_resume_after_reopen(tmp_checkpoint):
    handler = adzuna_handler_factory({1: _jobs(20)}, count=20)
    runner = build_runner(tmp_checkpoint, handler, min_postings=5)
    snap = runner.start("t-persist", {"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    assert snap["checkpoint"]["type"] == "search_plan_approval"
    plan = snap["checkpoint"]["searchPlanDraft"]
    runner2 = build_runner(tmp_checkpoint, handler, min_postings=5)
    resumed = runner2.resume("t-persist", {"plan": plan})
    assert resumed["status"] == "completed"
    assert resumed["report"]


def test_write_fixture_sample_artifacts(tmp_path):
    """Deterministic fixture-based sample outputs (not live Adzuna)."""
    samples = Path(__file__).resolve().parents[2] / "samples" / "fixture-runs"
    samples.mkdir(parents=True, exist_ok=True)
    checkpoint = tmp_path / "c.db"
    runner = build_runner(str(checkpoint), adzuna_handler_factory({1: _jobs(24)}), min_postings=5)
    snap = runner.start("sample-clear", {"role": "Data Analyst", "location": "Bangalore, India", "currency": "INR"})
    transcript = [{"event": "start", "interrupt": snap["checkpoint"]["type"]}]
    snap = runner.resume("sample-clear", {"plan": snap["checkpoint"]["searchPlanDraft"]})
    transcript.append({"event": "approved_plan"})
    (samples / "01-clear-common-role.json").write_text(json.dumps(snap["report"], indent=2), encoding="utf-8")
    (samples / "01-clear-common-role.md").write_text(snap["reportMarkdown"], encoding="utf-8")
    (samples / "01-clear-common-role-transcript.json").write_text(json.dumps(transcript, indent=2), encoding="utf-8")
    (samples / "01-SOURCE.txt").write_text(
        "DETERMINISTIC FIXTURE RUN — mocked Adzuna responses, no live API credentials used.\n",
        encoding="utf-8",
    )
    assert snap["status"] == "completed"


def test_parse_salary_is_predicted_inputs():
    from tools.adzuna import parse_salary_is_predicted

    # Should evaluate to False
    assert parse_salary_is_predicted("0") is False
    assert parse_salary_is_predicted(0) is False
    assert parse_salary_is_predicted("false") is False
    assert parse_salary_is_predicted("False") is False
    assert parse_salary_is_predicted(False) is False
    assert parse_salary_is_predicted(" 0 ") is False
    assert parse_salary_is_predicted("FALSE") is False
    assert parse_salary_is_predicted(0.0) is False
    assert parse_salary_is_predicted(None) is False
    assert parse_salary_is_predicted("") is False
    assert parse_salary_is_predicted("unknown") is False

    # Should evaluate to True
    assert parse_salary_is_predicted("1") is True
    assert parse_salary_is_predicted(1) is True
    assert parse_salary_is_predicted("true") is True
    assert parse_salary_is_predicted("True") is True
    assert parse_salary_is_predicted(True) is True
    assert parse_salary_is_predicted(" 1 ") is True
    assert parse_salary_is_predicted("TRUE") is True
    assert parse_salary_is_predicted(1.0) is True
    assert parse_salary_is_predicted("yes") is True


def test_normalize_result_salary_is_predicted():
    from tools.adzuna import _normalize_result

    # Adzuna string '0' denotes real disclosed salary, not predicted
    raw_disclosed = {
        "id": 1234,
        "title": "Data Analyst",
        "salary_min": 800000,
        "salary_max": 1000000,
        "salary_is_predicted": "0",
    }
    normalized = _normalize_result(raw_disclosed)
    assert normalized["salary_is_predicted"] is False

    # Adzuna string '1' denotes predicted salary
    raw_predicted = {
        "id": 5678,
        "title": "Data Analyst",
        "salary_min": 800000,
        "salary_max": 1000000,
        "salary_is_predicted": "1",
    }
    normalized_pred = _normalize_result(raw_predicted)
    assert normalized_pred["salary_is_predicted"] is True


def test_compensation_retains_valid_and_excludes_invalid_and_predicted():
    from services.compensation import summarize_compensation

    postings = [
        # Valid non-zero, non-predicted salary (should be retained)
        {"id": "p1", "salary_min": 600000, "salary_max": 1000000, "salary_is_predicted": False, "contract_time": "year"},
        {"id": "p2", "salary_min": 1000000, "salary_max": 1400000, "salary_is_predicted": False, "contract_time": "year"},
        {"id": "p3", "salary_min": 1200000, "salary_max": 1200000, "salary_is_predicted": False, "contract_time": "year"},
        # Predicted salary (must be excluded)
        {"id": "p4", "salary_min": 900000, "salary_max": 1100000, "salary_is_predicted": True, "contract_time": "year"},
        # Invalid zero salary (must be excluded, not represented as 0)
        {"id": "p5", "salary_min": 0, "salary_max": 0, "salary_is_predicted": False, "contract_time": "year"},
        {"id": "p6", "salary_min": None, "salary_max": 0, "salary_is_predicted": False, "contract_time": "year"},
        # Missing salary (must be excluded)
        {"id": "p7", "salary_min": None, "salary_max": None, "salary_is_predicted": False},
    ]

    stats = summarize_compensation(postings, "INR", {"INR": 1.0, "USD": 1.0})
    # Disclosed count should only count the 3 valid non-zero, non-predicted salaries
    assert stats["disclosedCount"] == 3
    assert stats["sampleSize"] == 3
    # 3 valid out of 7 postings = 42.9%
    assert stats["disclosedPayPercentage"] == 42.9
    # Midpoints: p1 = 800000, p2 = 1200000, p3 = 1200000 -> sorted [800000, 1200000, 1200000]
    assert stats["medianSalary"] == 1200000
    assert stats["percentile25"] == 800000
    assert stats["percentile75"] == 1200000
    assert stats["salaryMin"] == 800000
    assert stats["salaryMax"] == 1200000


def test_lpa_salary_normalization_inr():
    from services.compensation import summarize_compensation

    postings = [
        # Posting quoting 6 LPA in India (raw Adzuna source format from MathCo adz-5939457850)
        {"id": "p-lpa-6", "salary_min": 6, "salary_max": 6, "contract_time": "full_time"},
        # Posting quoting standard absolute INR (MathCo repost adz-5954451562)
        {"id": "p-std", "salary_min": 600000, "salary_max": 1000000, "currency": "INR", "contract_time": "year"},
        # Posting quoting LPA range (e.g. 12-15 LPA)
        {"id": "p-lpa-range", "salary_min": 12, "salary_max": 15, "currency": "INR", "contract_time": "year"},
        # Posting with explicit 'lpa' period
        {"id": "p-lpa-period", "salary_min": 20, "salary_max": 20, "salary_period": "lpa"},
    ]
    stats = summarize_compensation(postings, "INR", {"INR": 1.0})
    assert stats["disclosedCount"] == 4
    assert stats["sampleSize"] == 4
    # 6 LPA -> 600,000 INR
    # 600,000 - 1,000,000 -> 800,000 INR
    # 12 - 15 LPA -> 1,350,000 INR
    # 20 LPA -> 2,000,000 INR
    assert stats["salaryMin"] == 600000
    assert stats["salaryMax"] == 2000000
    assert stats["medianSalary"] == 1075000

