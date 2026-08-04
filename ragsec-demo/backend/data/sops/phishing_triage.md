# Phishing Triage Playbook

## Overview
This Standard Operating Procedure (SOP) defines the steps to investigate and triage suspected phishing emails reported by employees or flagged by email security gateways.

## Triage Steps
1. **Analyze the Email Headers**: Check the `Received` SPF, DKIM, and DMARC results.
2. **URL Inspection**: Extract all URLs and run them through URLScan or VirusTotal. Do not click links on corporate networks.
3. **Attachment Analysis**: Detonate any attachments in a sandbox environment to observe behavior.
4. **Impact Assessment**: Check email logs to see how many users received the same payload.
5. **Containment**: 
   - Purge the email from all user inboxes via Exchange/O365 compliance search.
   - Block malicious domains/IPs at the firewall and web proxy.
6. **Remediation**: If a user clicked the link or submitted credentials, immediately initiate the Credential Compromise Response SOP.
