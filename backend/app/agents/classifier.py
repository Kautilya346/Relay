import os
import json
import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("jansahayak.agent.classifier")



class ComplaintClassifierResult:
    def __init__(self, category: str, severity: int, safety_risk: int, title: str, summary: str):
        self.category = category
        self.severity = severity
        self.safety_risk = safety_risk
        self.title = title
        self.summary = summary


def classify_complaint_heuristic(description: str, category_override: str = None) -> ComplaintClassifierResult:
    """Fallback heuristic classifier when Gemini API key is unavailable."""
    desc_lower = description.lower()

    category = category_override or "General Civic Issue"
    if "pothole" in desc_lower or "road" in desc_lower or "tar" in desc_lower or "asphalt" in desc_lower:
        category = "Road & Potholes"
    elif "garbage" in desc_lower or "trash" in desc_lower or "dump" in desc_lower or "waste" in desc_lower:
        category = "Sanitation & Garbage"
    elif "water" in desc_lower or "leak" in desc_lower or "pipe" in desc_lower or "sewage" in desc_lower:
        category = "Water & Sewage"
    elif "light" in desc_lower or "dark" in desc_lower or "lamp" in desc_lower or "street light" in desc_lower:
        category = "Street Lighting"

    severity = 2
    safety_risk = 2

    if any(w in desc_lower for w in ["dangerous", "accident", "severe", "broken", "huge", "deep", "burst", "electric", "hazard"]):
        severity = 4
        safety_risk = 4

    if any(w in desc_lower for w in ["critical", "emergency", "fatal", "collapse", "overflowing"]):
        severity = 5
        safety_risk = 5

    title = f"{category} Incident"
    summary = description[:100] + ("..." if len(description) > 100 else "")

    return ComplaintClassifierResult(
        category=category,
        severity=severity,
        safety_risk=safety_risk,
        title=title,
        summary=summary
    )


async def classify_complaint(description: str, category_override: str = None, image_urls: List[str] = None) -> ComplaintClassifierResult:
    """Classifies a complaint using Gemini / Vertex AI LLM if available, otherwise heuristic engine."""
    from app.core.genai_client import get_genai_client
    client = get_genai_client()
    if not client:
        logger.info("GenAI client not configured. Using heuristic classification worker.")
        return classify_complaint_heuristic(description, category_override)

    try:


        prompt = f"""
You are an expert AI civic complaint classifier for JanSahayak.
Analyze the following citizen report and return a strict JSON object.

Report Description: "{description}"
User Suggested Category: "{category_override or 'None'}"

JSON Schema:
{{
  "category": "One of ['Road & Potholes', 'Sanitation & Garbage', 'Water & Sewage', 'Street Lighting', 'Public Transport', 'Parks & Infrastructure', 'General Civic Issue']",
  "severity": integer (1 to 5),
  "safetyRisk": integer (1 to 5),
  "title": "Short descriptive title max 8 words",
  "summary": "Clear summary of the civic problem"
}}
"""
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )



        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        data = json.loads(text)
        return ComplaintClassifierResult(
            category=data.get("category", category_override or "General Civic Issue"),
            severity=int(data.get("severity", 3)),
            safety_risk=int(data.get("safetyRisk", 2)),
            title=data.get("title", f"{category_override or 'Civic'} Issue"),
            summary=data.get("summary", description[:120])
        )
    except Exception as e:
        logger.warning(f"Gemini classification failed: {e}. Falling back to heuristic engine.")
        return classify_complaint_heuristic(description, category_override)
