"""
ragsec.backend.api.threat_lab_routes
FastAPI routes for Controlled Threat Simulation & Detection Lab.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any

from analysis.threat_lab_engine import threat_lab_supervisor, SAMPLE_CATALOG

router = APIRouter(prefix="/api/threat-lab", tags=["threat_lab"])

@router.get("/catalog")
def get_threat_lab_catalog():
    """Returns the list of 5 controlled harmless threat simulator samples."""
    return threat_lab_supervisor.list_catalog()

@router.post("/run/{sample_id}")
def run_threat_sample(sample_id: str):
    """
    Executes a specific threat simulation sample inside monitored_workspace/threat_lab/.
    Enforces independent safety failsafes and feeds observable behavior into the detection pipeline.
    """
    try:
        run = threat_lab_supervisor.run_sample(sample_id)
        return run
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start threat simulation: {str(e)}")

@router.get("/status/{test_id}")
def get_threat_test_status(test_id: str):
    """Returns chronological timeline, process PID, and detection verdict for a test run."""
    run = threat_lab_supervisor.get_test_status(test_id)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found.")
    return run

@router.post("/stop/{test_id}")
def stop_threat_test(test_id: str):
    """Manually stops an active test run and terminates its process tree."""
    res = threat_lab_supervisor.stop_test(test_id)
    return res

@router.post("/clean")
def clean_threat_lab_workspace():
    """Cleans up temporary test artifacts inside threat_lab/."""
    threat_lab_supervisor._clean_lab_dir()
    return {"status": "CLEANED", "message": "Threat Lab temporary workspace cleaned."}
