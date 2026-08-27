import os
import json
import logging
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.models.domain import ComplaintModel, IncidentModel

logger = logging.getLogger("jansahayak.agent.matcher")



class MatchVerificationResult:
    def __init__(self, is_match: bool, matched_incident_id: Optional[str], confidence: float, reasoning: str):
        self.is_match = is_match
        self.matched_incident_id = matched_incident_id
        self.confidence = confidence
        self.reasoning = reasoning


def verify_match_heuristic(complaint: ComplaintModel, candidate_incidents: List[IncidentModel]) -> MatchVerificationResult:
    """Semantic candidate matching logic for local execution / fallback."""
    if not candidate_incidents:
        return MatchVerificationResult(
            is_match=False,
            matched_incident_id=None,
            confidence=0.0,
            reasoning="No candidate incidents nearby within distance threshold."
        )

    # Find candidates with matching category
    best_candidate = None
    best_score = 0.0

    complaint_words = set(complaint.description.lower().split())

    for inc in candidate_incidents:
        # Category compatibility check
        if inc.category.lower() != complaint.category.lower():
            continue

        # Word overlap similarity
        inc_words = set((inc.title + " " + inc.summary).lower().split())
        if not complaint_words or not inc_words:
            overlap = 0.5
        else:
            intersection = complaint_words.intersection(inc_words)
            overlap = len(intersection) / max(1, min(len(complaint_words), len(inc_words)))

        score = 0.75 + (overlap * 0.25)
        if score > best_score:
            best_score = score
            best_candidate = inc

    if best_candidate and best_score >= 0.70:
        return MatchVerificationResult(
            is_match=True,
            matched_incident_id=best_candidate.id,
            confidence=round(best_score, 2),
            reasoning=f"High semantic and spatial correlation with existing incident '{best_candidate.title}' ({best_candidate.id})."
        )

    return MatchVerificationResult(
        is_match=False,
        matched_incident_id=None,
        confidence=round(best_score, 2),
        reasoning="Complaint describes a distinct issue from nearby existing incidents."
    )


async def verify_incident_match(
    complaint: ComplaintModel,
    candidate_incidents: List[IncidentModel]
) -> MatchVerificationResult:
    """Uses Gemini API to evaluate whether new complaint matches an active candidate incident."""
    if not candidate_incidents:
        return MatchVerificationResult(
            is_match=False,
            matched_incident_id=None,
            confidence=0.0,
            reasoning="No candidate incidents nearby."
        )

    from app.core.genai_client import get_genai_client
    client = get_genai_client()
    if not client:
        return verify_match_heuristic(complaint, candidate_incidents)

    try:


        candidates_formatted = [
            {
                "incidentId": inc.id,
                "category": inc.category,
                "title": inc.title,
                "summary": inc.summary,
            }
            for inc in candidate_incidents
        ]

        prompt = f"""
You are an AI Incident Matcher for JanSahayak civic management.
Your task is to determine if a new citizen report refers to the exact same physical issue as any existing candidate incident.

New Complaint:
- Category: {complaint.category}
- Description: "{complaint.description}"

Candidate Incidents Nearby:
{json.dumps(candidates_formatted, indent=2)}

Return a strict JSON object with:
{{
  "isMatch": boolean,
  "matchedIncidentId": "INC-XXXX or null",
  "confidence": float (0.0 to 1.0),
  "reasoning": "Explanation of matching decision"
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
        is_match = data.get("isMatch", False)
        confidence = float(data.get("confidence", 0.0))

        if is_match and confidence >= 0.70:
            return MatchVerificationResult(
                is_match=True,
                matched_incident_id=data.get("matchedIncidentId"),
                confidence=confidence,
                reasoning=data.get("reasoning", "Matched via Gemini verification.")
            )

        return MatchVerificationResult(
            is_match=False,
            matched_incident_id=None,
            confidence=confidence,
            reasoning=data.get("reasoning", "Distinct incident verified by Gemini.")
        )
    except Exception as e:
        logger.warning(f"Gemini incident matching failed: {e}. Using fallback matcher.")
        return verify_match_heuristic(complaint, candidate_incidents)
