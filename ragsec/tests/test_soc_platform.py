import unittest
import sys
sys.path.insert(0, 'backend')
from domain.soc_models import SecurityEvent, ThreatCategory, ClassificationState, IncidentStatus, MitigationStatus
from pipeline.classifier import classify_security_event
from pipeline.event_pipeline import EventPipeline
from domain.mitigation import MitigationLifecycle

class TestSOCPlatform(unittest.TestCase):
    def test_benign_event_classification(self):
        msg = "User FINANCE\\jsmith successfully logged on."
        classification = classify_security_event(msg, is_suspicious=False)
        self.assertEqual(classification.state, ClassificationState.BENIGN)
        self.assertEqual(classification.category, ThreatCategory.BENIGN)

    def test_threat_classification_phishing(self):
        msg = "User clicked suspicious link in email, credential harvest suspected."
        classification = classify_security_event(msg, is_suspicious=True)
        self.assertEqual(classification.state, ClassificationState.THREAT)
        self.assertEqual(classification.category, ThreatCategory.PHISHING)
        self.assertEqual(classification.severity, "medium")

    def test_threat_classification_ransomware(self):
        msg = "Rapid encryption of files and shadow copies deleted using vssadmin."
        classification = classify_security_event(msg, is_suspicious=True)
        self.assertEqual(classification.state, ClassificationState.THREAT)
        self.assertEqual(classification.category, ThreatCategory.RANSOMWARE)
        self.assertEqual(classification.severity, "critical")

    def test_unknown_suspicious_event(self):
        msg = "Something weird happened but no known signatures matched."
        classification = classify_security_event(msg, is_suspicious=True)
        self.assertEqual(classification.state, ClassificationState.UNKNOWN)
        self.assertEqual(classification.category, ThreatCategory.UNKNOWN)
        self.assertEqual(classification.severity, "medium")

    def test_event_pipeline_incident_spawning(self):
        pipeline = EventPipeline()
        evt = SecurityEvent(
            id="EVT-001",
            network_id="NET-CORP",
            device_id="DEV-001",
            source_type="EDR",
            event_type="FileActivity",
            raw_message="Shadow copies deleted",
            is_suspicious=True
        )
        incident = pipeline.process_event(evt)
        self.assertIsNotNone(incident)
        self.assertEqual(incident.status, IncidentStatus.DETECTED)
        self.assertEqual(incident.threat_classification.category, ThreatCategory.RANSOMWARE)
        
        retrieved_inc = pipeline.get_incident(incident.id)
        self.assertEqual(retrieved_inc.id, incident.id)
        
    def test_mitigation_lifecycle(self):
        pipeline = EventPipeline()
        evt = SecurityEvent(
            id="EVT-001",
            network_id="NET-CORP",
            device_id="DEV-001",
            source_type="EDR",
            event_type="Process",
            raw_message="malware signature match",
            is_suspicious=True
        )
        incident = pipeline.process_event(evt)
        
        mitigation_service = MitigationLifecycle()
        
        # 1. Recommend
        action = mitigation_service.recommend_mitigation(incident, "Quarantine", "Isolate host", "DEV-001")
        self.assertEqual(action.status, MitigationStatus.RECOMMENDED)
        self.assertEqual(incident.status, IncidentStatus.MITIGATION_RECOMMENDED)
        
        # 2. Approve
        action = mitigation_service.approve_mitigation(action.id, "SOC-ANALYST-1")
        self.assertEqual(action.status, MitigationStatus.APPROVED)
        self.assertEqual(action.approved_by, "SOC-ANALYST-1")
        
        # 3. Execute
        action = mitigation_service.execute_mitigation(action.id)
        self.assertEqual(action.status, MitigationStatus.EXECUTED)
        
        # 4. Verify
        action = mitigation_service.verify_mitigation(action.id, True, "Host isolated successfully.")
        self.assertEqual(action.status, MitigationStatus.VERIFIED)

if __name__ == '__main__':
    unittest.main()
