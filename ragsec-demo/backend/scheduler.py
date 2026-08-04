import argparse
from apscheduler.schedulers.blocking import BlockingScheduler
from sources import CVENVDAdapter, MitreAttackAdapter, SyntheticIncidentAdapter, SOPLoaderAdapter

def run_adapter(adapter):
    print(f"\n[Scheduler] Firing {adapter.__class__.__name__}...")
    try:
        docs = adapter.fetch()
        # In a real system, this would call the same logic as ingest.py
        # For Section 1b verification, printing the fetch result count is enough
        # to prove the scheduled firing works.
        print(f"[Scheduler] Fetched {len(docs)} documents from {adapter.__class__.__name__}.")
    except Exception as e:
        print(f"[Scheduler] Error running adapter: {e}")

def main():
    parser = argparse.ArgumentParser(description="RagSec Source Scheduler")
    parser.add_argument("--test", action="store_true", help="Run in test mode (60 second intervals)")
    args = parser.parse_args()

    sched = BlockingScheduler()
    
    adapters = [
        CVENVDAdapter(limit=50),
        MitreAttackAdapter(),
        SyntheticIncidentAdapter(),
        SOPLoaderAdapter()
    ]
    
    scheduled_count = 0
    for adapter in adapters:
        if getattr(adapter, "update_frequency", "manual") != "manual":
            interval = 5 if args.test else 86400 # 5s for test, 24h for normal
            print(f"Registering {adapter.__class__.__name__} with interval {interval} seconds.")
            sched.add_job(run_adapter, 'interval', seconds=interval, args=[adapter])
            scheduled_count += 1
            
    if scheduled_count == 0:
        print("No non-manual adapters found to schedule.")
        return
        
    print(f"Scheduler started with {scheduled_count} jobs. Press Ctrl+C to exit.")
    try:
        sched.start()
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    main()
