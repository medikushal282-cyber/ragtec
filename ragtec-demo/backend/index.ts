import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock Data
const generateMockThreats = () => {
    return Array.from({ length: 20 }).map((_, i) => ({
        id: `THREAT-${i + 1}`,
        name: `Mock Threat ${i + 1}`,
        severity: ['Critical', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 4)],
        status: ['New', 'Investigating', 'Resolved'][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    }));
};

app.get('/api/threats', (req, res) => {
    res.json({ threats: generateMockThreats() });
});

app.post('/api/retrieve', (req, res) => {
    const { query } = req.body;
    
    // Simulate Retrieval + Reranking
    const results = Array.from({ length: 5 }).map((_, i) => {
        const similarity = Math.random();
        const recency = Math.random();
        const severity = Math.random();
        const trust = Math.random();
        
        // Final Score = 0.45 * Similarity + 0.30 * Recency + 0.15 * Severity + 0.10 * Source Trust
        const finalScore = (0.45 * similarity) + (0.30 * recency) + (0.15 * severity) + (0.10 * trust);
        
        return {
            id: `DOC-${i + 1}`,
            snippet: `This is a mock retrieved document related to "${query}". It discusses simulated threat indicators.`,
            metrics: { similarity, recency, severity, trust },
            finalScore
        };
    }).sort((a, b) => b.finalScore - a.finalScore);

    res.json({ query, results });
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
