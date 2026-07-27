from fastapi import APIRouter
import random

router = APIRouter(
    prefix="/api/system",
    tags=["system"],
)

@router.get("/telemetry")
def get_telemetry():
    # Mocking system CPU and Memory to avoid external dependencies
    cpu_percent = round(random.uniform(15.0, 45.0), 1)
    mem_percent = round(random.uniform(40.0, 75.0), 1)
    
    # Mocking some security-specific metrics
    latency = random.randint(1, 4)
    accuracy = round(random.uniform(99.5, 99.9), 1)
    
    return {
        "cpu_usage": cpu_percent,
        "memory_usage": mem_percent,
        "latency_ms": latency,
        "accuracy": accuracy,
        "active_proxies": random.randint(10, 25)
    }
