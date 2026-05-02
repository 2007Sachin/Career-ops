from typing import Dict, Any, List
from pydantic import BaseModel
from playwright.async_api import Page

class UnmappedField(BaseModel):
    field_id: str
    label: str
    field_type: str

class FormMapping(BaseModel):
    mapped_fields: Dict[str, Any]
    unmapped_fields: List[UnmappedField]

async def map_application_form(page: Page, ats_url: str, user_profile: Dict[str, Any]) -> FormMapping:
    """
    Navigates to the ATS URL and parses form fields.
    Maps standard fields to user_profile data and flags unmapped fields for HITL.
    """
    await page.goto(ats_url, timeout=120000)
    await page.wait_for_load_state("networkidle")
    
    # Execute JS to extract all inputs, textareas, and selects
    fields_data = await page.evaluate('''() => {
        const inputs = Array.from(document.querySelectorAll("input:not([type='hidden']):not([type='submit']), textarea, select"));
        return inputs.map(el => {
            let labelText = "";
            if (el.id) {
                const label = document.querySelector(`label[for="${el.id}"]`);
                if (label) labelText = label.innerText;
            }
            if (!labelText) {
                labelText = el.getAttribute("aria-label") || el.placeholder || el.name || "";
            }
            return {
                id: el.id || el.name || "unknown",
                name: el.name || "",
                type: el.type || el.tagName.toLowerCase(),
                label: labelText.trim(),
                selector: el.id ? `#${el.id}` : (el.name ? `[name="${el.name}"]` : '')
            };
        }).filter(f => f.selector !== '');
    }''')
    
    mapped = {}
    unmapped = []
    
    # Standard mapping heuristics
    for field in fields_data:
        label_lower = field['label'].lower()
        name_lower = field['name'].lower()
        
        # Check standard fields
        if "resume" in label_lower or "cv" in label_lower or field['type'] == "file":
            mapped[field['selector']] = {"type": "file", "action": "upload_resume"}
        elif "first name" in label_lower or "name" == label_lower or "fname" in name_lower:
            mapped[field['selector']] = {"type": "text", "value": user_profile.get("full_name", "")}
        elif "email" in label_lower or "e-mail" in label_lower:
            mapped[field['selector']] = {"type": "text", "value": user_profile.get("email", "")}
        elif "phone" in label_lower:
            mapped[field['selector']] = {"type": "text", "value": user_profile.get("phone", "")}
        elif "linkedin" in label_lower:
            mapped[field['selector']] = {"type": "text", "value": user_profile.get("linkedin_url", "")}
        elif "github" in label_lower:
            mapped[field['selector']] = {"type": "text", "value": user_profile.get("github_username", "")}
        else:
            # Requires HITL
            unmapped.append(UnmappedField(
                field_id=field['selector'],
                label=field['label'],
                field_type=field['type']
            ))
                
    return FormMapping(mapped_fields=mapped, unmapped_fields=unmapped)
