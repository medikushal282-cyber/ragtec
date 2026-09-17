"""
ragsec.backend.analysis.static_analyzer
Safe deterministic static analysis of file contents — NO execution.
"""
import re
import hashlib
import os
import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Deterministic behavioral signal rules (pattern → (label, severity_weight))
# Severity weights: 1=low, 2=medium, 3=high
# ---------------------------------------------------------------------------
_BEHAVIORAL_RULES: List[Tuple[str, str, int]] = [
    # Ransomware / Destructive
    (r"(?i)del\s+/[fqs].*\*|rmdir\s+/s|remove-item.*-recurse", "Destructive file deletion loop", 3),
    (r"(?i)vssadmin.*delete|wmic.*shadowcopy.*delete", "Shadow copy deletion (ransomware indicator)", 3),
    (r"(?i)(for|foreach).*\.(doc|docx|xls|xlsx|pdf|jpg|png|mp4|db).*encrypt|ren.*\.crypted", "Mass file encryption loop", 3),
    (r"(?i)open\([^)]+['\"]wb['\"]\).*\bfor\b|\bwith open\b.*for.*in os\.walk", "Mass file write loop (ransomware-like)", 2),

    # Unbounded process spawning (Malware / DoS)
    (r"(?i)^:loop\b|goto\s+loop", "Unbounded goto-loop (process spawning risk)", 2),
    (r"(?i)(start|subprocess|os\.system|createprocess)\b.{0,80}\n.{0,20}(goto|while\s+true|loop)", "Process spawn inside infinite loop", 3),
    (r"(?i)while\s+(true|1|True)\s*[:{]\s*\n[^\n]*\b(start|subprocess|Popen|os\.system)\b", "Subprocess call inside infinite loop", 3),
    (r"(?i)for\s+/l\s+%%\w+\s+in\s*\(\s*\d+\s*,\s*\d+\s*,\s*0\s*\)", "Infinite FOR /L loop (step=0)", 3),

    # Encoded / Obfuscated commands
    (r"(?i)-enc(odedcommand)?[\s]+[A-Za-z0-9+/]{20,}={0,2}", "Base64-encoded PowerShell command", 3),
    (r"(?i)\[System\.Convert\]::FromBase64String|base64\.b64decode", "Runtime base64 decode (obfuscation)", 2),
    (r"(?i)certutil.*-decode|certutil.*-urlcache", "certutil misuse for payload decode/download", 3),
    (r"(?i)iex\s*\(|invoke-expression\s*\(", "IEX / Invoke-Expression (code injection risk)", 3),

    # Payload retrieval / C2
    (r"(?i)(wget|curl|Invoke-WebRequest|DownloadString|DownloadFile)\s+['\"]?https?://", "Payload download from remote URL", 3),
    (r"(?i)socket\.(connect|send|recv)|requests\.(get|post)\s*\(['\"]https?://", "Network communication (C2 indicator)", 2),
    (r"(?i)(nc|ncat|netcat)\s+-[eluvw]|\bsocat\b", "Reverse shell utility usage", 3),
    (r"(?i)schtasks.*/create|reg\s+add.*\\run|HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "Persistence via scheduled task or registry Run key", 3),

    # Credential collection
    (r"(?i)(mimikatz|sekurlsa|lsass|procdump.*lsass)", "LSASS / credential dumping indicator", 3),
    (r"(?i)Get-Credential|$env:USERNAME.*password|ConvertTo-SecureString", "Credential collection in script", 2),
    (r"(?i)net\s+user\s+\w+\s+\w+\s*/add|net\s+localgroup\s+administrators.*add", "Unauthorized user creation", 3),

    # Self-replication / spreading
    (r"(?i)shutil\.copy.*__file__|copy\s+%0\s+|\bfor\b.*\brobocopy\b.*%0", "Self-replication: script copies itself", 3),
    (r"(?i)(xcopy|robocopy|copy)\s+\S+\s+\\\\\w+\\[a-z\$]+\\", "Lateral copy to network share (lateral movement)", 2),

    # Suspicious PowerShell
    (r"(?i)-ExecutionPolicy\s+Bypass|-noprofile\s+-windowstyle\s+hidden", "PowerShell execution policy bypass with hidden window", 3),
    (r"(?i)Set-MpPreference.*DisableRealtimeMonitoring.*\$true|add-mppreference.*exclusionpath", "AV/Defender disabling", 3),

    # Suspicious file operations
    (r"(?i)attrib\s+\+[sh]|icacls.*\/deny.*Everyone|cacls.*\/e.*\/d", "File hiding or ACL manipulation", 2),
]

# Minimum number of signals to classify as THREAT vs UNKNOWN
_THREAT_SIGNAL_THRESHOLD = 1


@dataclass
class StaticSignal:
    line_no: int
    line_content: str
    label: str
    severity_weight: int  # 1=low, 2=medium, 3=high


@dataclass
class StaticAnalysisResult:
    sha256: str
    file_type: str
    file_size: int
    signals: List[StaticSignal] = field(default_factory=list)
    is_text: bool = True
    error: Optional[str] = None


def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _is_text(content: bytes) -> bool:
    """Heuristic: if <10% non-printable non-whitespace bytes → treat as text."""
    sample = content[:4096]
    non_text = sum(1 for b in sample if b < 0x09 or (0x0e <= b <= 0x1f) or b == 0x7f)
    return non_text / max(len(sample), 1) < 0.1


def run_static_analysis(filename: str, content: bytes) -> StaticAnalysisResult:
    """
    Performs deterministic static analysis on file content.
    NEVER executes the file or any subprocess.
    """
    sha = compute_sha256(content)
    ext = os.path.splitext(filename)[1].lower()
    size = len(content)

    if not _is_text(content):
        return StaticAnalysisResult(
            sha256=sha, file_type=ext or "binary", file_size=size,
            is_text=False, signals=[]
        )

    try:
        text = content.decode("utf-8", errors="replace")
    except Exception as e:
        return StaticAnalysisResult(
            sha256=sha, file_type=ext or "unknown", file_size=size,
            is_text=False, error=str(e)
        )

    lines = text.splitlines()
    signals: List[StaticSignal] = []

    for pattern, label, weight in _BEHAVIORAL_RULES:
        for i, line in enumerate(lines, start=1):
            if re.search(pattern, line):
                signals.append(StaticSignal(
                    line_no=i,
                    line_content=line.strip()[:200],
                    label=label,
                    severity_weight=weight
                ))
                break  # one signal per rule per file

    return StaticAnalysisResult(
        sha256=sha, file_type=ext or "text", file_size=size,
        is_text=True, signals=signals
    )
