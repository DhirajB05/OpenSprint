import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

router.post('/caption', async (req, res) => {
    const { template, roastSummary, archetype, bangerQuote, topLanguages } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        const prompt = `You are a meme caption genius who creates viral, hilarious meme text for developer humor.

Developer profile context:
- Archetype: ${archetype}
- Banger Quote: "${bangerQuote}"
- Top Languages: ${(topLanguages || []).join(', ')}
- Roast summary: ${roastSummary}

Meme template selected: "${template}"

Based on the meme format and the developer's profile, generate the perfect meme captions.

Return ONLY a JSON object like:
{
  "topText": "TOP TEXT OF MEME (keep it short, punchy, all caps OK)",
  "bottomText": "BOTTOM TEXT OF MEME (the punchline, short & viral)"
}

Classic meme style: IMPACT font caps, punchy, internet-native humor. Reference their actual coding behavior. Make it something a developer would instantly share on Instagram or Twitter. Return ONLY valid JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
        const data = JSON.parse(cleaned);

        res.json(data);
    } catch (err) {
        console.error('Meme caption error:', err);
        res.status(500).json({ error: 'Failed to generate meme caption' });
    }
});

export default router;
