# Credential Compromise and Account Takeover Response

## Overview
Procedure for responding to compromised user accounts, often detected via anomalous login locations, impossible travel, or post-phishing credential submission.

## Containment Steps
1. **Suspend Account**: Immediately disable the user account in Active Directory and Azure AD/Okta.
2. **Revoke Tokens**: Revoke all active session tokens and force a sign-out across all devices.
3. **Reset Credentials**: Generate a new, complex password.
4. **MFA Verification**: Ensure the attacker did not enroll a rogue MFA device. Clear all existing MFA registrations and require the user to re-register under IT supervision.
5. **Investigation**:
   - Review audit logs for the last 72 hours for the compromised account.
   - Check for inbox rules (e.g., forwarding emails to external addresses).
   - Check for data exfiltration or access to unauthorized SharePoint/network drives.
