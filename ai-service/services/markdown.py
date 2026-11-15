from __future__ import annotations


def brief_to_markdown(brief: dict) -> str:
    outlook = brief.get("hiringOutlook") or {}
    demand = brief.get("demandVolume") or {}
    comp = brief.get("compensation") or {}
    skills = brief.get("skillsAndRequirements") or {}
    emp = brief.get("employerCompetition") or {}
    rec = brief.get("clientRecommendations") or {}
    notes = brief.get("runNotes") or {}
    lines = [
        f"# Talent Market Brief — {brief.get('role')} in {brief.get('location')}",
        "",
        f"_Generated {brief.get('generatedAt')}_",
        "",
        "## Executive summary",
        brief.get("summary", ""),
        "",
        "## Hiring outlook",
        f"**{outlook.get('verdict')}** — {outlook.get('reason')}",
        outlook.get("metricSummary", ""),
        "",
        "## Demand",
        f"- Active postings (sample): {demand.get('totalActivePostings')}",
        f"- Analysed: {demand.get('sampleAnalyzed')}",
        f"- Average posting age (days): {demand.get('averagePostingAgeDays')}",
        "",
        "## Compensation",
        f"- Currency: {comp.get('currency')}",
        f"- Median: {comp.get('medianSalary')}",
        f"- IQR (25th–75th): {comp.get('percentile25')} – {comp.get('percentile75')}",
        f"- Range: {comp.get('salaryMin')} – {comp.get('salaryMax')}",
        f"- Disclosure rate: {comp.get('disclosedPayPercentage')}%",
    ]
    if comp.get("distributionBands"):
        lines += ["", "### Salary distribution bands"]
        for b in comp.get("distributionBands") or []:
            lines.append(f"- {b.get('band')}: {b.get('count')} postings ({b.get('percentage')}%)")

    if comp.get("seniorityBreakdown"):
        lines += ["", "### Seniority progression benchmarks"]
        curr = comp.get("currency") or "USD"
        for row in comp.get("seniorityBreakdown") or []:
            lvl = row.get("level")
            med = row.get("median") or 0
            min_v = row.get("min") or 0
            max_v = row.get("max") or 0
            cnt = row.get("count") or 0
            disc = row.get("disclosedCount") or 0
            if med > 0:
                lines.append(f"- **{lvl}**: Median {med:,} {curr} (Range: {min_v:,} – {max_v:,} {curr}; {disc} disclosed / {cnt} postings)")
            else:
                lines.append(f"- **{lvl}**: Insufficient disclosed salary data ({cnt} postings analysed)")

    lines += [
        "",
        "## Must-have skills",
    ]
    for s in skills.get("mustHaveSkills") or []:
        lines.append(f"- {s.get('name')} ({s.get('percentage')}%)")
    lines += ["", "## Nice-to-have skills"]
    for s in skills.get("niceToHaveSkills") or []:
        lines.append(f"- {s.get('name')} ({s.get('percentage')}%)")

    if skills.get("experienceDistribution") or skills.get("typicalYearsExperience"):
        lines += [
            "",
            "## Experience & seniority distribution",
            f"- Typical years experience: {skills.get('typicalYearsExperience', 0)}",
        ]
        for exp in skills.get("experienceDistribution") or []:
            lines.append(f"- {exp.get('bracket')}: {exp.get('percentage')}%")

    lines += ["", "## Employers"]
    for e in (emp.get("topEmployers") or [])[:8]:
        lines.append(f"- {e.get('name')} ({e.get('type')}): {e.get('openPositions')} postings")

    obs = brief.get("observedTitles") or []
    if obs:
        lines += ["", "## Observed job titles"]
        for t in obs[:8]:
            lines.append(f"- {t.get('title')}: {t.get('count')} postings ({t.get('sharePercent')}%)")

    band = rec.get("recommendedSalaryBand") or {}
    lines += [
        "",
        "## Client recommendations",
        f"- Suggested title: {rec.get('suggestedJobTitle')}",
        f"- Salary band: {band.get('min')} – {band.get('max')} (target {band.get('target')})",
        f"- Priority skills: {', '.join(rec.get('leadSkills') or [])}",
        f"- JD hook: {rec.get('jobDescriptionHook')}",
        f"- Strategic takeaway: {rec.get('strategicTakeaway', '')}",
        "",
        "## Evidence-backed insights",
    ]
    for insight in brief.get("confidenceInsights") or []:
        ids = ", ".join(insight.get("samplePostingIds") or [])
        lines.append(
            f"- **{insight.get('category')}** ({insight.get('confidence')}): {insight.get('claim')} "
            f"[n={insight.get('evidencePostingCount')}; ids={ids}]"
        )
    lines += [
        "",
        "## Run notes",
        f"- Postings fetched: {notes.get('postingsFetched')}",
        f"- Deduplicated: {notes.get('postingsDeduplicated')}",
        f"- Duplicates removed: {notes.get('dedupedDuplicatesCount', 0)}",
        f"- Analysed: {notes.get('postingsAnalyzed')}",
        f"- Execution time: {notes.get('executionTimeSeconds', 0)}s",
        f"- Data source: {notes.get('dataSource')}",
    ]
    qa = notes.get("questionsAndAnswers") or []
    if qa:
        lines += ["", "### Clarifications addressed"]
        for item in qa:
            lines.append(f"- Q: {item.get('question')} -> A: {item.get('answer')}")
    lines += [
        "",
        "### Assumptions",
    ]
    for a in notes.get("assumptionsMade") or []:
        lines.append(f"- {a}")
    return "\n".join(lines)
