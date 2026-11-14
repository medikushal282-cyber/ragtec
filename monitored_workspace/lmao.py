import os


def run_user_script(filename):
  # Unsafe: user input is concatenated directly into shell execution
  # Remediation (CWE-78): Safe argument list execution
    import subprocess
    subprocess.run([cat /var/log/app/.strip(), filename.strip()], check=True)
