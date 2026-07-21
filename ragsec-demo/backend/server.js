const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- MOCK DATA GENERATORS ---

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate fresh timestamps each time to simulate dynamic behavior
const getRecentDate = (daysAgoMax = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgoMax));
  date.setHours(date.getHours() - getRandomInt(0, 23));
  return date.toISOString();
};

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const SOURCES = ['CrowdStrike', 'Microsoft Threat Intelligence', 'Mandiant', 'CISA', 'Internal HoneyPot', 'Dark Web Monitor'];
const STATUSES = ['Investigating', 'Mitigated', 'Active', 'Monitoring'];
const ATTACK_TYPES = ['Ransomware', 'Phishing', 'SQL Injection', 'Zero-Day', 'DDoS', 'Malware'];

const generateMockData = () => {
  const cves = Array.from({ length: 10 }).map((_, i) => ({
    id: `CVE-202${getRandomInt(3, 6)}-${getRandomInt(1000, 9999)}`,
    type: 'CVE',
    description: `Critical vulnerability in widely used enterprise software allowing RCE.`,
    severity: getRandomElement(['High', 'Critical']),
    timestamp: getRecentDate(90),
    source: getRandomElement(SOURCES),
    status: getRandomElement(STATUSES)
  }));

  const actors = Array.from({ length: 10 }).map((_, i) => ({
    id: `APT-${getRandomInt(10, 99)}`,
    type: 'Threat Actor',
    description: `State-sponsored actor targeting critical infrastructure.`,
    severity: 'High',
    timestamp: getRecentDate(120),
    source: getRandomElement(SOURCES),
    status: 'Active'
  }));

  const zeroDays = Array.from({ length: 5 }).map((_, i) => ({
    id: `ZDAY-${getRandomInt(100, 999)}`,
    type: 'Zero-Day',
    description: `Undocumented exploit observed in the wild targeting network edge devices.`,
    severity: 'Critical',
    timestamp: getRecentDate(2), // Very recent
    source: getRandomElement(SOURCES),
    status: 'Investigating'
  }));

  const reports = Array.from({ length: 20 }).map((_, i) => ({
    id: `REP-${getRandomInt(1000, 9999)}`,
    type: getRandomElement(ATTACK_TYPES),
    description: `Threat report indicating potential ${getRandomElement(ATTACK_TYPES).toLowerCase()} activity in sector.`,
    severity: getRandomElement(SEVERITIES),
    timestamp: getRecentDate(30),
    source: getRandomElement(SOURCES),
    status: getRandomElement(STATUSES)
  }));

  return [...cves, ...actors, ...zeroDays, ...reports];
};


// --- API ENDPOINTS ---

// Get all threats (used for dashboard and feeds)
app.get('/api/threats', (req, res) => {
  const threats = generateMockData();
  res.json(threats);
});

// Time-aware Retrieval Endpoint
app.post('/api/retrieve', (req, res) => {
  const { query, useRagsec = true } = req.body;
  
  let threats = generateMockData();

  // Simulate retrieval and scoring
  const scoredThreats = threats.map(threat => {
    // 1. Semantic Similarity (Mocked: 0.1 to 0.99)
    const similarity = parseFloat(getRandomFloat(0.3, 0.99));
    
    // 2. Recency (0.0 to 1.0 based on how new it is)
    const threatDate = new Date(threat.timestamp);
    const now = new Date();
    const daysOld = (now - threatDate) / (1000 * 60 * 60 * 24);
    // Exponential decay for recency score
    const recency = Math.max(0, Math.exp(-daysOld / 30));

    // 3. Severity (0.25 to 1.0)
    let severityScore = 0.25;
    if (threat.severity === 'Medium') severityScore = 0.50;
    if (threat.severity === 'High') severityScore = 0.75;
    if (threat.severity === 'Critical') severityScore = 1.0;

    // 4. Source Trust (0.5 to 1.0)
    const trust = parseFloat(getRandomFloat(0.6, 1.0));

    let finalScore = 0;
    if (useRagsec) {
      // RAGSec Formula
      finalScore = (0.45 * similarity) + (0.30 * recency) + (0.15 * severityScore) + (0.10 * trust);
    } else {
      // Traditional AI (Similarity only)
      finalScore = similarity;
    }

    return {
      ...threat,
      scores: {
        similarity: similarity.toFixed(2),
        recency: recency.toFixed(2),
        severity: severityScore.toFixed(2),
        trust: trust.toFixed(2),
        final: finalScore.toFixed(2)
      }
    };
  });

  // Sort by final score descending
  scoredThreats.sort((a, b) => b.scores.final - a.scores.final);

  // Return top 10
  res.json(scoredThreats.slice(0, 10));
});

// AI Chat Simulation
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      role: 'assistant',
      content: `Based on the latest RAGSec intelligence, I analyzed your request regarding "${message}". I have identified recent critical threats that match this profile.`,
      confidence: getRandomFloat(0.85, 0.99),
      evidence: [
        `ZDAY-${getRandomInt(100, 999)} (Severity: Critical, Age: <24h)`,
        `CVE-2024-${getRandomInt(1000, 9999)} (Severity: High, Source: CISA)`
      ]
    });
  }, 1500);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RAGSec Backend running on port ${PORT}`);
  
  // Placeholders for future architecture
  console.log('[Placeholder] Pinecone / ChromaDB initialized.');
  console.log('[Placeholder] PostgreSQL connected.');
  console.log('[Placeholder] OpenAI API ready.');
});
