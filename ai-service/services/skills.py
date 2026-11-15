"""Skill alias normalization and frequency analysis."""

from __future__ import annotations

import re
from collections import Counter

SKILL_ALIASES = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "pandas": "Python",
    "numpy": "Python",
    "sql": "SQL",
    "mysql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "powerbi": "Power BI",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "excel": "Excel",
    "ms excel": "Excel",
    "dbt": "dbt",
    "data build tool": "dbt",
    "snowflake": "Snowflake",
    "bigquery": "BigQuery",
    "bq": "BigQuery",
    "airflow": "Airflow",
    "aws": "AWS",
    "gcp": "GCP",
    "azure": "Azure",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "react": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "java": "Java",
    "golang": "Go",
    "go": "Go",
    "c#": "C#",
    "csharp": "C#",
    "spark": "Spark",
    "pyspark": "Spark",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "llm": "LLMs",
    "langchain": "LangChain",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
}

KNOWN_SKILLS = sorted(set(SKILL_ALIASES.values()), key=len, reverse=True)

STAFFING_HINTS = (
    "staffing",
    "recruit",
    "talent solutions",
    "manpower",
    "consulting services",
    "rpo",
    "contracting",
    "randstad",
    "adecco",
    "kforce",
    "robert half",
    "insight global",
)


def normalize_skill(name: str) -> str:
    key = re.sub(r"\s+", " ", (name or "").strip().lower())
    key = key.replace("_", " ")
    return SKILL_ALIASES.get(key, name.strip().title() if name else "")


def extract_skills_heuristic(text: str) -> list[str]:
    blob = (text or "").lower()
    found: list[str] = []
    for alias, canonical in SKILL_ALIASES.items():
        if re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", blob):
            found.append(canonical)
    # de-dupe preserving order
    out: list[str] = []
    seen = set()
    for s in found:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def classify_employer(company: str, description: str = "") -> str:
    blob = f"{company} {description}".lower()
    return "Staffing" if any(h in blob for h in STAFFING_HINTS) else "Direct"


def skill_frequencies(
    analyses: list[dict],
    total_postings: int,
) -> tuple[list[dict], list[dict]]:
    must = Counter()
    nice = Counter()
    all_skills = Counter()
    for row in analyses:
        must_list = [normalize_skill(s) for s in row.get("must_have_skills") or []]
        nice_list = [normalize_skill(s) for s in row.get("nice_to_have_skills") or []]
        skills = [normalize_skill(s) for s in row.get("skills") or []]
        if not must_list and skills:
            split = max(1, len(skills) // 2)
            must_list = skills[:split]
            nice_list = skills[split:]
        unique_must = {s for s in must_list if s}
        unique_nice = {s for s in nice_list if s and s not in unique_must}
        unique_all = {s for s in skills if s} | unique_must | unique_nice
        for s in unique_must:
            must[s] += 1
        for s in unique_nice:
            nice[s] += 1
        for s in unique_all:
            all_skills[s] += 1
    n = max(total_postings, 1)
    must_have = [
        {"name": k, "frequency": v, "percentage": round(v / n * 100)}
        for k, v in must.most_common(8)
        if v / n >= 0.35 or v == must.most_common(1)[0][1]
    ]
    nice_have = [
        {"name": k, "frequency": v, "percentage": round(v / n * 100)}
        for k, v in nice.most_common(8)
        if k not in {m["name"] for m in must_have}
    ]
    if not must_have:
        must_have = [
            {"name": k, "frequency": v, "percentage": round(v / n * 100)}
            for k, v in all_skills.most_common(5)
        ]
        nice_have = [
            {"name": k, "frequency": v, "percentage": round(v / n * 100)}
            for k, v in all_skills.most_common(10)[5:]
        ]
    return must_have, nice_have
