import os
import uuid
import tempfile
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from supabase import create_client, Client
from typing import Dict, Any, List
from agents.models.schemas import JobMatchSchema

supabase_url = os.getenv("SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_KEY", "")

def generate_and_upload_pdf(candidate_info: Dict[str, str], match: JobMatchSchema, evidence: List[Dict[str, Any]]) -> str:
    supabase: Client = create_client(supabase_url, supabase_key)
    
    fd, pdf_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    doc = SimpleDocTemplate(pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    Story = []
    
    # Header
    Story.append(Paragraph(f"<b>{candidate_info.get('full_name', 'Candidate')}</b>", styles["Title"]))
    contact_info = f"Email: {candidate_info.get('email', '')} | GitHub: {candidate_info.get('github_username', '')} | LinkedIn: {candidate_info.get('linkedin_url', '')}"
    Story.append(Paragraph(contact_info, styles["Normal"]))
    Story.append(Spacer(1, 12))
    
    # Verified Skill Match
    Story.append(Paragraph("<b>Verified Skill Match</b>", styles["Heading2"]))
    Story.append(Paragraph(f"Overall Match Score: {match.overall_match_score}/100", styles["Normal"]))
    Story.append(Paragraph(match.justification_narrative, styles["Normal"]))
    Story.append(Spacer(1, 12))
    
    # Evidence
    Story.append(Paragraph("<b>Evidence</b>", styles["Heading2"]))
    for e in evidence:
        req = e.get('matched_requirement', 'General Match')
        skill = e.get('inferred_skill', 'N/A')
        metric = e.get('raw_metric', 'N/A')
        url = e.get('proof_url', '')
        
        Story.append(Paragraph(f"<b>Requirement:</b> {req}", styles["Normal"]))
        Story.append(Paragraph(f"<i>Skill:</i> {skill} | <i>Metric:</i> {metric}", styles["Normal"]))
        Story.append(Paragraph(f"<i>Proof:</i> <a href='{url}'>{url}</a>", styles["Normal"]))
        Story.append(Spacer(1, 6))
        
    Story.append(Spacer(1, 24))
    Story.append(Paragraph("<i>Verified by Pulse-Ops | pulse-ops.com</i>", styles["Normal"]))
    
    doc.build(Story)
    
    file_name = f"{uuid.uuid4()}_tailored_match.pdf"
    
    with open(pdf_path, "rb") as f:
        supabase.storage.from_("mission_files").upload(file_name, f, {"content-type": "application/pdf"})
        
    os.remove(pdf_path)
    
    public_url = supabase.storage.from_("mission_files").get_public_url(file_name)
    return public_url
