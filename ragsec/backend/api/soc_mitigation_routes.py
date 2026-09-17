class MitigationRequest(BaseModel):
    action_type: str
    description: str
    target_device_id: str

class AnalystDecision(BaseModel):
    analyst_id: str

class VerifyRequest(BaseModel):
    success: bool
    notes: str

@router.post("/incidents/{incident_id}/mitigations", response_model=MitigationAction)
def recommend_mitigation(incident_id: str, req: MitigationRequest):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    action = mitigation_service.recommend_mitigation(inc, req.action_type, req.description, req.target_device_id)
    return action

@router.get("/incidents/{incident_id}/mitigations", response_model=List[MitigationAction])
def get_mitigations_for_incident(incident_id: str):
    inc = pipeline_instance.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc.mitigation_actions

@router.post("/mitigations/{action_id}/approve", response_model=MitigationAction)
def approve_mitigation(action_id: str, req: AnalystDecision):
    action = mitigation_service.approve_mitigation(action_id, req.analyst_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not in pending state")
    return action

@router.post("/mitigations/{action_id}/reject", response_model=MitigationAction)
def reject_mitigation(action_id: str, req: AnalystDecision):
    action = mitigation_service.reject_mitigation(action_id, req.analyst_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not in pending state")
    return action

@router.post("/mitigations/{action_id}/execute", response_model=MitigationAction)
def execute_mitigation(action_id: str):
    action = mitigation_service.execute_mitigation(action_id)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not approved")
    return action

@router.post("/mitigations/{action_id}/verify", response_model=MitigationAction)
def verify_mitigation(action_id: str, req: VerifyRequest):
    action = mitigation_service.verify_mitigation(action_id, req.success, req.notes)
    if not action:
        raise HTTPException(status_code=400, detail="Invalid action or not executed")
    return action

@router.get("/mitigations/history", response_model=List[MitigationAction])
def get_mitigation_history():
    rows = db_module.get_all_records("mitigations")
    return [MitigationAction(**row) for row in rows]
