# Ransomware Containment Playbook

## Overview
Rapid containment procedures for when ransomware activity (mass file encryption, shadow copy deletion, or known ransom notes) is detected on an endpoint or server.

## Containment Steps
1. **Isolate the Host**: Immediately disconnect the affected host from the network (physically unplug or isolate via EDR network containment). Do NOT power down the machine as this destroys volatile memory.
2. **Disable SMB/RDP**: Ensure SMB (Port 445) and RDP (Port 3389) are blocked laterally across the subnet to prevent worm propagation (e.g., WannaCry).
3. **Identify Patient Zero**: Review EDR logs and firewall logs to trace the initial vector.
4. **Preserve Evidence**: Capture a memory dump of the isolated machine for forensic analysis.
5. **Eradication**: Reimage the affected machine entirely. Do not attempt to clean and reuse an infected OS.
6. **Recovery**: Restore data from offline backups verified prior to the incident timestamp.
