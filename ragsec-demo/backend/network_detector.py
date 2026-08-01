import random
import uuid
import time
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import datetime

# Mock coordinates for realistic mapping
LOCATIONS = [
    {"lat": 38.8951, "lng": -77.0364, "desc": "Washington DC"},
    {"lat": 51.5074, "lng": -0.1278, "desc": "London"},
    {"lat": 35.6762, "lng": 139.6503, "desc": "Tokyo"},
    {"lat": 55.7558, "lng": 37.6173, "desc": "Moscow"},
    {"lat": 39.9042, "lng": 116.4074, "desc": "Beijing"},
    {"lat": -33.8688, "lng": 151.2093, "desc": "Sydney"}
]

FLAGS = [
    {"type": "Lateral Movement", "severity": "High", "desc": "Suspicious SMB traffic between internal workstations."},
    {"type": "Beaconing", "severity": "Medium", "desc": "Regular outbound C2 heartbeat detected."},
    {"type": "Exfiltration", "severity": "Critical", "desc": "Large outbound DNS queries detected (DNS Tunneling)."},
    {"type": "Port Scan", "severity": "Low", "desc": "Internal host sweeping subnets."},
]

def generate_network_anomaly():
    """Simulates an enterprise network anomaly and logs it to the database."""
    db: Session = SessionLocal()
    try:
        flag_info = random.choice(FLAGS)
        location = random.choice(LOCATIONS)
        
        src_ip = f"10.0.{random.randint(1,255)}.{random.randint(1,255)}"
        dst_ip = f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        
        flag = models.NetworkFlag(
            id=str(uuid.uuid4()),
            source_ip=src_ip,
            destination_ip=dst_ip,
            flag_type=flag_info["type"],
            severity=flag_info["severity"],
            description=f"{flag_info['desc']} ({location['desc']})",
            latitude=location["lat"] + (random.random() * 0.1),
            longitude=location["lng"] + (random.random() * 0.1)
        )
        
        db.add(flag)
        db.commit()
        print(f"Network Detector: Generated flag -> {flag.flag_type}")
    except Exception as e:
        print(f"Error generating network anomaly: {e}")
    finally:
        db.close()
