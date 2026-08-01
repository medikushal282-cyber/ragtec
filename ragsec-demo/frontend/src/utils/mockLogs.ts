export const generateMockLog = () => {
  const categories = [
    { type: 'NETWORK', resources: ['10.0.5.23 -> 192.168.1.100', 'BGP Router-01', 'VPN-GW-US'], details: ['Established TCP connection on port 443.', 'BGP route update received.', 'VPN tunnel keep-alive sent.', '[SUSPICIOUS] Lateral movement detected across subnets.'] },
    { type: 'EMAIL', resources: ['Exchange-Server', 'user@corp.com', 'O365-Gateway'], details: ['Delivered incoming mail from trusted sender.', 'Outbound email sent successfully.', 'Mailbox quota warning issued.', '[THREAT] Blocked inbound phishing payload.'] },
    { type: 'FIREWALL', resources: ['PaloAlto-FW-01', 'Cisco-ASA-Edge', 'Fortigate-DMZ'], details: ['Allowed outbound HTTPS traffic.', 'NAT translation successful.', 'Configuration backup completed.', '[SUSPICIOUS] Dropped inbound packet on port 3389.'] },
    { type: 'DNS', resources: ['DNS-Primary', 'DNS-Secondary', '1.1.1.1'], details: ['Resolved corp.internal to 10.0.0.5.', 'Zone transfer completed successfully.', 'Cached record expired and refreshed.', '[THREAT] Possible DNS tunneling query observed.'] },
    { type: 'AUTH', resources: ['ActiveDirectory', 'Okta-SSO', 'RADIUS'], details: ['Successful user login from trusted IP.', 'Password rotation completed.', 'MFA challenge passed successfully.', '[SUSPICIOUS] 5 failed SSH login attempts for root.'] },
    { type: 'IDS_IPS', resources: ['Suricata-Sensor', 'Snort-Edge'], details: ['Rule update applied successfully.', 'Sensor heartbeat received.', 'Traffic volume within normal baseline.', '[THREAT] Signature match: EternalBlue exploit attempt.'] },
    { type: 'WEB_SERVER', resources: ['NGINX-LB', 'Apache-Web-02'], details: ['GET /index.html 200 OK.', 'SSL certificate renewed.', 'Worker process spawned successfully.', '[THREAT] XSS payload detected in search query.'] },
    { type: 'EDR', resources: ['CrowdStrike-Agent', 'SentinelOne', 'Host-Win11'], details: ['Agent definition update applied.', 'Scheduled file scan completed clean.', 'Normal svchost.exe startup.', '[THREAT] Ransomware behavior: rapid file encryption stopped.'] },
    { type: 'THREAT_INTEL', resources: ['CISA KEV', 'MITRE ATT&CK', 'NVD Feed'], details: ['Daily threat feed sync completed.', 'No new high-severity CVEs ingested.', 'Connection to MITRE API successful.', '[SUSPICIOUS] New critical CVE-2026-X ingested.'] }
  ];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const resource = category.resources[Math.floor(Math.random() * category.resources.length)];
  const detail = category.details[Math.floor(Math.random() * category.details.length)];

  return {
    id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user: 'system_daemon',
    action_type: category.type,
    resource: resource,
    details: detail,
    timestamp: new Date().toISOString()
  };
};
