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
    # Ransomware / Destructive / Extortion
    (r"(?i)del\s+/[fqs].*\*|rmdir\s+/s|remove-item.*-recurse", "Destructive file deletion loop", 3),
    (r"(?i)vssadmin.*delete|wmic.*shadowcopy.*delete", "Shadow copy deletion (ransomware indicator)", 3),
    (r"(?i)(for|foreach).*\.(doc|docx|xls|xlsx|pdf|jpg|png|mp4|db).*encrypt|ren.*\.crypted", "Mass file encryption loop", 3),
    (r"(?i)open\([^)]+['\"]wb['\"]\).*\bfor\b|\bwith open\b.*for.*in os\.walk", "Mass file write loop (ransomware-like)", 2),
    (r"(?i)files\s+have\s+been\s+encrypted|contact.*decrypt|onion\.mail|\.raglock|\.crypted|blacksuit|lockbit", "Ransom Note / Cryptographic Extortion Indicator", 3),

    # Web Shell / Backdoor Execution
    (r"(?i)eval\s*\(\s*base64_decode|passthru\s*\(|shell_exec\s*\(|system\s*\(\s*\$|assert\s*\(\s*\$", "Web Shell / Dynamic Code Execution Backdoor", 3),
    (r"(?i)\$_POST\[|\$_GET\[|\$_REQUEST\[", "Web Input Command Handler (Web shell indicator)", 2),

    # Unbounded process spawning (Malware / DoS)
    (r"(?i)^:loop\b|goto\s+loop", "Unbounded goto-loop (process spawning risk)", 2),
    (r"(?i)(start|subprocess|os\.system|createprocess)\b.{0,80}\n.{0,20}(goto|while\s+true|loop)", "Process spawn inside infinite loop", 3),
    (r"(?i)while\s+(true|1|True)\s*[:{]\s*\n[^\n]*\b(start|subprocess|Popen|os\.system)\b", "Subprocess call inside infinite loop", 3),
    (r"(?i)for\s+/l\s+%%\w+\s+in\s*\(\s*\d+\s*,\s*\d+\s*,\s*0\s*\)", "Infinite FOR /L loop (step=0)", 3),

    # Encoded / Obfuscated commands
    (r"(?i)-enc(odedcommand)?[\s]+[A-Za-z0-9+/]{20,}={0,2}", "Base64-encoded PowerShell command", 3),
    (r"(?i)\[System\.Convert\]::FromBase64String|base64\.b64decode", "Runtime base64 decode (obfuscation)", 2),
    (r"(?i)certutil.*-decode|certutil.*-urlcache", "certutil misuse for payload decode/download", 3),
    (r"(?i)iex\s*\(|invoke-expression\s*\(|\binvoke-expression\b", "IEX / Invoke-Expression (code injection risk)", 3),

    # Payload retrieval / C2
    (r"(?i)(wget|curl|Invoke-WebRequest|DownloadString|DownloadFile)\s+['\"]?https?://", "Payload download from remote URL", 3),
    (r"(?i)socket\.(connect|send|recv)|requests\.(get|post)\s*\(['\"]https?://", "Network communication (C2 indicator)", 2),
    (r"(?i)(nc|ncat|netcat)\s+-[eluvw]|\bsocat\b", "Reverse shell utility usage", 3),
    (r"(?i)schtasks.*/create|reg\s+add.*\\run|HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "Persistence via scheduled task or registry Run key", 3),

    # Process Injection / Binary PE APIs
    (r"(?i)VirtualAlloc|CreateRemoteThread|WriteProcessMemory", "PE Process Injection / Shellcode Execution API", 3),

    # Credential collection
    (r"(?i)(mimikatz|sekurlsa|lsass|procdump.*lsass|DumpCreds)", "LSASS / credential dumping indicator", 3),
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
class VulnerabilitySignal:
    line_no: int
    line_content: str
    vulnerability_type: str        # e.g., "SQL_INJECTION", "COMMAND_INJECTION", "HARDCODED_SECRET"
    cwe: str                       # e.g., "CWE-89", "CWE-78", "CWE-798"
    title: str                     # e.g., "SQL Injection (SQLi)"
    severity: str                  # "critical", "high", "medium", "low"
    risk_score: int                # 0 - 100
    description: str
    mitigation_options: List[Dict[str, str]]
    recommended_mitigation: str
    suggested_patch: str


# ---------------------------------------------------------------------------
# SAST Software Vulnerability Rules (Application Flaws - Distinct from Malware)
# ---------------------------------------------------------------------------
_VULNERABILITY_RULES = [
    {
        "type": "SQL_INJECTION",
        "cwe": "CWE-89",
        "title": "SQL Injection (SQLi)",
        "pattern": r"(?i)(f[\"'].*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b.*\{|cursor\.execute\(f[\"']|\.execute\([^)]*%\s*\([^)]*\)|cursor\.execute\([^,\n]*\+\s*\w+|query\s*=\s*f[\"'].*(SELECT|INSERT|UPDATE|DELETE).*\{)",
        "severity": "high",
        "risk_score": 70,
        "description": "Direct string interpolation in SQL query permits arbitrary SQL injection (CWE-89).",
        "mitigation_options": [
            {"id": "parameterize", "label": "Parameterize Query", "icon": "shield", "action": "PARAMETERIZE_SQLI"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Use parameterized queries / prepared statements (e.g. cursor.execute('SELECT * FROM users WHERE username = ?', (username,))) instead of raw string interpolation.",
        "patch_template": "query = \"SELECT * FROM users WHERE username = ?\"\ncursor.execute(query, (username,))"
    },
    {
        "type": "COMMAND_INJECTION",
        "cwe": "CWE-78",
        "title": "OS Command Injection",
        "pattern": r"(?i)(os\.system\(f[\"']|subprocess\.(Popen|run|call)\([^)]*shell\s*=\s*True|subprocess\.(Popen|run|call)\(f[\"']|exec\(f[\"']|eval\(f[\"'])",
        "severity": "critical",
        "risk_score": 80,
        "description": "Dynamic shell execution with untrusted input allows OS command injection (CWE-78).",
        "mitigation_options": [
            {"id": "safe_subprocess", "label": "Use Argument List", "icon": "shield", "action": "SAFE_SUBPROCESS"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Pass arguments as a validated list without shell=True to avoid subshell interpretation.",
        "patch_template": "# Safe: Argument list without shell=True\nsubprocess.run([\"command\", safe_arg], check=True)"
    },
    {
        "type": "HARDCODED_SECRET",
        "cwe": "CWE-798",
        "title": "Hardcoded Secret / API Key",
        "pattern": r"(?i)(api[_-]?key|secret[_-]?key|aws[_-]?secret|password|access[_-]?token|db_pass)\s*=\s*[\"'][A-Za-z0-9_\-\.\/+=]{12,}[\"']",
        "severity": "high",
        "risk_score": 65,
        "description": "Sensitive credential or API key hardcoded in plaintext source code (CWE-798).",
        "mitigation_options": [
            {"id": "env_migrate", "label": "Move to os.environ", "icon": "key", "action": "ENV_MIGRATE"},
            {"id": "redact", "label": "Redact Secret", "icon": "lock", "action": "REDACT_SECRET"}
        ],
        "recommended_mitigation": "Migrate secrets to environment variables or a secure key vault (e.g. os.environ.get('API_KEY')).",
        "patch_template": "# Safe: Retrieve from environment\napi_key = os.environ.get(\"API_KEY\", \"\")"
    },
    {
        "type": "PATH_TRAVERSAL",
        "cwe": "CWE-22",
        "title": "Path Traversal",
        "pattern": r"(?i)(open\(os\.path\.join\(.*(request|param|user|filename|path)|open\(f[\"'][^\"']*\{[^}]*(filename|path|user))",
        "severity": "high",
        "risk_score": 65,
        "description": "Unvalidated path parameter allows directory traversal (CWE-22) outside base directories.",
        "mitigation_options": [
            {"id": "sanitize_path", "label": "Sanitize Path", "icon": "shield", "action": "SANITIZE_PATH"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Wrap user-supplied filenames with os.path.basename() and verify the resolved path remains inside the allowed directory.",
        "patch_template": "safe_filename = os.path.basename(user_input)\nfilepath = os.path.join(SAFE_DIR, safe_filename)"
    },
    {
        "type": "INSECURE_DESERIALIZATION",
        "cwe": "CWE-502",
        "title": "Insecure Deserialization",
        "pattern": r"(?i)(pickle\.loads|yaml\.load\([^,)]*(\)|,\s*Loader\s*=\s*(yaml\.)?Loader))",
        "severity": "high",
        "risk_score": 65,
        "description": "Untrusted deserialization can lead to arbitrary code execution (CWE-502).",
        "mitigation_options": [
            {"id": "safe_loader", "label": "Use SafeLoader / JSON", "icon": "shield", "action": "SAFE_LOADER"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Use yaml.safe_load() or standard json.loads() instead of insecure unpickling.",
        "patch_template": "# Safe: Use safe deserialization\ndata = yaml.safe_load(raw_input)"
    },
    {
        "type": "REFLECTED_XSS",
        "cwe": "CWE-79",
        "title": "Reflected XSS",
        "pattern": r"(?i)(render_template_string\(f[\"']|innerHTML\s*=\s*|res\.send\(f[\"'].*<)",
        "severity": "medium",
        "risk_score": 50,
        "description": "Direct injection of untrusted variables into HTML response enables Cross-Site Scripting (CWE-79).",
        "mitigation_options": [
            {"id": "escape_html", "label": "Escape HTML Output", "icon": "shield", "action": "ESCAPE_HTML"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Escape user variables with html.escape() or use framework contextual auto-escaping.",
        "patch_template": "import html\nsafe_output = html.escape(user_input)"
    },
    {
        "type": "WEAK_CRYPTO",
        "cwe": "CWE-327",
        "title": "Weak Cryptographic Hash",
        "pattern": r"(?i)(hashlib\.(md5|sha1)\(|DES\.new\(|Cipher.*algorithms\.ARC4)",
        "severity": "low",
        "risk_score": 30,
        "description": "Collision-prone or deprecated cryptographic hash/cipher used (CWE-327).",
        "mitigation_options": [
            {"id": "upgrade_sha256", "label": "Upgrade to SHA-256", "icon": "shield", "action": "UPGRADE_SHA256"},
            {"id": "patch", "label": "Apply SAST Patch", "icon": "tool", "action": "AUTO_PATCH"}
        ],
        "recommended_mitigation": "Upgrade to hashlib.sha256() or cryptographic key derivation functions (Argon2 / PBKDF2).",
        "patch_template": "# Safe: Cryptographically secure hash\nhash_val = hashlib.sha256(data).hexdigest()"
    }
]


import math

def calculate_shannon_entropy(content: bytes) -> float:
    """Calculates Shannon entropy of byte sequence: H = -sum(p * log2(p)). Range: 0.0 to 8.0."""
    if not content:
        return 0.0
    length = len(content)
    freq = [0] * 256
    for b in content:
        freq[b] += 1
    entropy = 0.0
    for count in freq:
        if count > 0:
            p = count / length
            entropy -= p * math.log2(p)
    return round(entropy, 4)


@dataclass
class StaticAnalysisResult:
    sha256: str
    file_type: str
    file_size: int
    entropy: float = 0.0
    signals: List[StaticSignal] = field(default_factory=list)
    vulnerabilities: List[VulnerabilitySignal] = field(default_factory=list)
    is_text: bool = True
    dynamic_analysis_status: str = "NOT_PERFORMED (Disposable VM sandbox unavailable on host; host execution strictly prohibited)"
    error: Optional[str] = None


def compute_sha256(content: Any) -> str:
    if isinstance(content, str):
        content = content.encode("utf-8", errors="ignore")
    return hashlib.sha256(content).hexdigest()


def _is_text(content: Any) -> bool:
    """Heuristic: if <10% non-printable non-whitespace bytes → treat as text."""
    if isinstance(content, str):
        content = content.encode("utf-8", errors="ignore")
    sample = content[:4096]
    non_text = sum(1 for b in sample if b < 0x09 or (0x0e <= b <= 0x1f) or b == 0x7f)
    return non_text / max(len(sample), 1) < 0.1


def run_static_analysis(filename: str, content: Any = None) -> StaticAnalysisResult:
    """
    Performs deterministic static analysis on file content.
    NEVER executes the file or any subprocess.
    """
    # Handle swapped arguments gracefully if called as (content, filename)
    if isinstance(filename, bytes) or (isinstance(filename, str) and content is not None and len(filename) > len(str(content)) and ("\n" in filename or "import " in filename or "def " in filename)):
        filename, content = str(content), filename

    if content is None:
        content = b""
    elif isinstance(content, str):
        content = content.encode("utf-8", errors="ignore")

    sha = compute_sha256(content)
    ext = os.path.splitext(filename)[1].lower()
    size = len(content)
    entropy = calculate_shannon_entropy(content)
    signals: List[StaticSignal] = []

    # 1. Standard EICAR test signature check
    if b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE" in content:
        signals.append(StaticSignal(
            line_no=1,
            line_content="EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
            label="EICAR Standard Anti-Malware Test Signature",
            severity_weight=3
        ))

    # 2. Shannon entropy anomaly check (packed or encrypted payload)
    if entropy >= 7.0 and size >= 256:
        signals.append(StaticSignal(
            line_no=1,
            line_content=f"High Shannon Entropy: {entropy:.2f} bits/byte",
            label=f"High Shannon Entropy ({entropy:.2f}) - packed/encrypted payload indicator",
            severity_weight=2
        ))

    if not _is_text(content):
        # Extract ASCII / UTF-8 strings from binary to detect PE API imports and anomalies
        extracted_strings = re.findall(rb"[A-Za-z0-9_\-\.]{4,}", content)
        text_from_bin = " ".join(s.decode('ascii', errors='ignore') for s in extracted_strings)
        is_pe = content[:2] == b"MZ" or filename.lower().endswith((".exe", ".dll", ".bin", ".sys"))
        if is_pe and any(api.lower() in text_from_bin.lower() for api in ["virtualalloc", "createremotethread", "writeprocessmemory", "cmd.exe", "powershell"]):
            signals.append(StaticSignal(
                line_no=1,
                line_content="PE Header Import Anomaly: Process Injection & Shell Execution APIs",
                label="PE Header Import Anomaly: Process Injection APIs",
                severity_weight=3
            ))

        for pattern, label, weight in _BEHAVIORAL_RULES:
            if re.search(pattern, text_from_bin):
                signals.append(StaticSignal(
                    line_no=1,
                    line_content=text_from_bin[:200],
                    label=label,
                    severity_weight=weight
                ))

        return StaticAnalysisResult(
            sha256=sha, file_type=ext or "binary", file_size=size,
            entropy=entropy, is_text=False, signals=signals
        )

    try:
        text = content.decode("utf-8", errors="replace")
    except Exception as e:
        return StaticAnalysisResult(
            sha256=sha, file_type=ext or "unknown", file_size=size,
            entropy=entropy, is_text=False, error=str(e)
        )

    lines = text.splitlines()

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

    # 3. SAST Software Vulnerability Scan (Dedicated Vulnerable Code Detection)
    vulnerabilities: List[VulnerabilitySignal] = []
    for vuln_rule in _VULNERABILITY_RULES:
        for i, line in enumerate(lines, start=1):
            if re.search(vuln_rule["pattern"], line):
                vulnerabilities.append(VulnerabilitySignal(
                    line_no=i,
                    line_content=line.strip(),
                    vulnerability_type=vuln_rule["type"],
                    cwe=vuln_rule["cwe"],
                    title=vuln_rule["title"],
                    severity=vuln_rule["severity"],
                    risk_score=vuln_rule["risk_score"],
                    description=vuln_rule["description"],
                    mitigation_options=vuln_rule["mitigation_options"],
                    recommended_mitigation=vuln_rule["recommended_mitigation"],
                    suggested_patch=vuln_rule["patch_template"]
                ))
                break  # one vulnerability hit per class per file

    return StaticAnalysisResult(
        sha256=sha, file_type=ext or "text", file_size=size,
        entropy=entropy, is_text=True, signals=signals, vulnerabilities=vulnerabilities
    )


def generate_remediated_code(content_text: str, vuln_type: str) -> str:
    """
    Produces remediated, secure drop-in code for known vulnerability types.
    """
    if vuln_type == "SQL_INJECTION":
        # Handle query = f"SELECT ... {username}" followed by cursor.execute(query)
        res = re.sub(
            r'([ \t]*)query\s*=\s*f["\']SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*[\'"]\{(\w+)\}[\'"][\'"]\s*\n[ \t]*cursor\.execute\(query\)',
            r'\1# Remediation (CWE-89): Parameterized query prevents SQL injection\n\1query = "SELECT * FROM \2 WHERE \3 = ?"\n\1cursor.execute(query, (\4,))',
            content_text
        )
        # Handle standalone query = f"SELECT ..."
        if res == content_text:
            res = re.sub(
                r'([ \t]*)query\s*=\s*f["\']SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*[\'"]\{(\w+)\}[\'"][\'"]',
                r'\1# Remediation (CWE-89): Parameterized query prevents SQL injection\n\1query = "SELECT * FROM \2 WHERE \3 = ?"\n\1cursor.execute(query, (\4,))',
                content_text
            )
            if "cursor.execute(query)\n" in res:
                res = re.sub(r'[ \t]*cursor\.execute\(query\)\r?\n', '', res)
        # Generic f-string cursor execute
        res = re.sub(
            r'([ \t]*)cursor\.execute\(f["\']SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*[\'"]\{(\w+)\}[\'"][\'"]\)',
            r'\1# Remediation (CWE-89): Parameterized prepared statement\n\1cursor.execute("SELECT * FROM \2 WHERE \3 = ?", (\4,))',
            res
        )
        # Clean comment indicating unsafe
        res = res.replace("# Unsafe: Direct string concatenation allows SQL injection", "# Safe: Parameterized query prevents SQL injection")
        return res

    elif vuln_type == "COMMAND_INJECTION":
        res = re.sub(
            r'os\.system\(f["\']([^"\'\n]+)\{([^}]+)\}([^"\'\n]*)["\']\)',
            r'# Remediation (CWE-78): Safe argument list execution\n    import subprocess\n    subprocess.run([\1.strip(), \2.strip()], check=True)',
            content_text
        )
        res = re.sub(
            r'subprocess\.(Popen|run|call)\(([^,\n]+),\s*shell\s*=\s*True([^)]*)\)',
            r'# Remediation (CWE-78): Avoid shell=True with argument list\n    subprocess.\1(\2, shell=False\3)',
            res
        )
        return res

    elif vuln_type == "HARDCODED_SECRET":
        res = re.sub(
            r'(api[_-]?key|secret[_-]?key|password)\s*=\s*["\'][A-Za-z0-9_\-\.\/+=]{12,}["\']',
            r'# Remediation (CWE-798): Injected via environment variable\nimport os\n\1 = os.environ.get("\1".upper(), "")',
            content_text
        )
        return res

    elif vuln_type == "PATH_TRAVERSAL":
        res = re.sub(
            r'open\(os\.path\.join\(([^,\n]+),\s*([^)\n]+)\)\)',
            r'# Remediation (CWE-22): Path sanitized with os.path.basename\n    safe_name = os.path.basename(\2)\n    open(os.path.join(\1, safe_name))',
            content_text
        )
        return res

    elif vuln_type == "INSECURE_DESERIALIZATION":
        res = content_text.replace("yaml.load(data)", "yaml.safe_load(data)").replace("pickle.loads(", "json.loads(")
        return res

    elif vuln_type == "REFLECTED_XSS":
        res = re.sub(
            r'render_template_string\(f["\']([^"\'\n]*)\{([^}]+)\}([^"\'\n]*)["\']\)',
            r'import html\n    safe_val = html.escape(\2)\n    render_template_string(f"\1{safe_val}\3")',
            content_text
        )
        return res

    elif vuln_type == "WEAK_CRYPTO":
        res = content_text.replace("hashlib.md5(", "hashlib.sha256(").replace("hashlib.sha1(", "hashlib.sha256(")
        return res

    return content_text

