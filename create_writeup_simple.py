import os
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

BASE_DIR = r'C:/Market_Scout_Agent'
OUTPUT_PDF = os.path.join(BASE_DIR, 'Market_Scout_Writeup.pdf')

styles = getSampleStyleSheet()
story = []

# Title
story.append(Paragraph('Market Scout Agent – Design Write‑up', styles['Title']))
story.append(Spacer(1, 12))

# Architecture
story.append(Paragraph('Architecture', styles['Heading2']))
arch = (
    "The agent is built as a LangGraph StateGraph with six nodes: Intake, Clarify, Plan, Fetch, Analyse, Brief. "
    "State schema (ScoutState) is a Pydantic BaseModel with fields: request, search_plan, postings, analysis, run_notes, stage. "
    "Typed state makes debugging easy and enables checkpointing."
)
story.append(Paragraph(arch, styles['BodyText']))
story.append(Spacer(1, 12))

# Human‑in‑the‑loop design
story.append(Paragraph('Human‑in‑the‑loop design', styles['Heading2']))
hitl = (
    "Two pauses are implemented with LangGraph interrupt(): "
    "1) Clarify pause after Intake – asks 1‑3 targeted questions when role/location/seniority are ambiguous. "
    "2) Low‑data pause after Fetch – if postings are below MIN_POSTINGS the user can broaden the search or continue with weak data. "
    "Both store the partially‑filled ScoutState so a later resume call continues exactly where it left off."
)
story.append(Paragraph(hitl, styles['BodyText']))
story.append(Spacer(1, 12))

# Prompting strategy
story.append(Paragraph('Prompting strategy', styles['Heading2']))
prompt = (
    "All LLM calls use with_structured_output() to enforce a JSON schema defined with Pydantic. "
    "Prompts contain a brief task description, required fields list, and a few‑shot example. "
    "During testing the model omitted some fields; we added a validation‑retry node that re‑prompts with a tighter schema."
)
story.append(Paragraph(prompt, styles['BodyText']))
story.append(Spacer(1, 12))

# Large and small result sets
story.append(Paragraph('Large and small result sets', styles['Heading2']))
result = (
    "Fetch decides sufficiency using MIN_POSTINGS (hard minimum) and POSTINGS_TARGET (desired count). "
    "If postings >= target the graph proceeds; otherwise it either expands the radius or triggers the low‑data pause. "
    "Large result sets are processed in parallel batches (BATCH_SIZE=40) via LangGraph Send/Receive nodes; results are merged in a reducer. "
    "Small sets skip batching and run a single Analyse node."
)
story.append(Paragraph(result, styles['BodyText']))
story.append(Spacer(1, 12))

# Failure modes
story.append(Paragraph('Failure modes', styles['Heading2']))
fail = (
    "* API rate‑limit or timeout – Fetch retries up to 3 times, then falls back to cached sample. "
    "* Malformed LLM output – validation error triggers a retry; after two failures we abort with a low‑confidence flag. "
    "* Ambiguous clarification answers – if still vague we continue with best‑guess values and tag the brief low confidence. "
    "* Duplicate postings – deduplication uses a hash of title+company+url; collisions are logged but do not break the run."
)
story.append(Paragraph(fail, styles['BodyText']))
story.append(Spacer(1, 12))

# What’s next
story.append(Paragraph('What’s next', styles['Heading2']))
next_steps = (
    "1. Persist user preferences (currency, seniority) via a LangGraph Store. "
    "2. Add a supervisor agent that delegates to specialist sub‑agents (salary, skills, competition). "
    "3. Stream node‑by‑node progress to the frontend via websockets for a richer UI. "
    "4. Implement a probabilistic confidence model for low‑data runs instead of a binary pause/continue decision."
)
story.append(Paragraph(next_steps, styles['BodyText']))
story.append(Spacer(1, 12))

# Build PDF
doc = SimpleDocTemplate(OUTPUT_PDF, pagesize=LETTER, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
doc.build(story)
print(f"PDF generated at {OUTPUT_PDF}")
