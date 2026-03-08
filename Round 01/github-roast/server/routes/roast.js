import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const ARCHETYPES = [
    'Tutorial Hoarder 📚', 'Midnight Coder 🌙', 'Forever In Progress 🚧',
    'Star Chaser ⭐', 'Fork Collector 🍴', 'README Philosopher 📝',
    'One-Language Wonder 🎯', 'Framework Hopper 🐸', 'Commit Shy 😶',
    'Serial Abandonist 🏃', 'npm install Enthusiast 📦', 'The Ghost Committer 👻',
    'Todo Archaeologist 🏺', 'Stack Overflow Copy-Paster 📋', 'The Eternal Beginner 🌱'
];

const MODE_PROMPTS = {
    friendly: `You are a warm, encouraging friend who gently teases a developer with light-hearted humor. Use lots of emojis. Be supportive but funny.`,
    sarcastic: `You are a sarcastic but brilliant tech lead who uses dry wit and irony. You're not mean, just deliciously sarcastic. Channel your inner snarky code reviewer.`,
    savage: `You are a brutally honest, no-holds-barred AI roaster who delivers savage but hilarious coding critiques. Be ruthless but stay funny — not hateful. Channel your inner Gordon Ramsay but for code.`
};

router.post('/', async (req, res) => {
    const { githubData, mode = 'savage' } = req.body;
    if (!githubData) return res.status(400).json({ error: 'No GitHub data provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

        const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.savage;

        const prompt = `${modePrompt}

Here is a GitHub developer profile to roast:

Username: ${githubData.username}
Name: ${githubData.name}
Bio: ${githubData.bio || 'None (suspicious)'}
Account Age: ${githubData.accountAge} years
Public Repos: ${githubData.publicRepos} (${githubData.forkedCount} are forks 👀)
Own Repos: ${githubData.ownRepoCount}
Total Stars: ${githubData.totalStars}
Followers: ${githubData.followers} | Following: ${githubData.following}
Top Languages: ${githubData.topLanguages.join(', ') || 'None detected (yikes)'}
Top Repos: ${githubData.topRepos.map(r => `${r.name} (⭐${r.stars}, ${r.lang}): ${r.description || 'no description'}`).join(' | ')}
Some repo names: ${githubData.repoNames.slice(0, 10).join(', ')}
Location: ${githubData.location || 'Unknown (hiding)'}
${githubData.readme ? `README snippet: "${githubData.readme.slice(0, 500)}"` : 'No README (they gave up)'}

Generate a JSON response with this EXACT structure:
{
  "archetype": "One of these archetypes that best fits them: ${ARCHETYPES.join(', ')}",
  "roastLines": [
    "Line 1 starting with an emoji - a specific roast about their repos/languages/stats",
    "Line 2 starting with an emoji - another specific roast",
    "Line 3 starting with an emoji - roast about their commit style or repo count",
    "Line 4 starting with an emoji - roast about something specific in their profile",
    "Line 5 starting with an emoji - a final savage/funny observation",
    "Line 6 starting with an emoji - optional bonus roast if there's material"
  ],
  "bangerQuote": "A single unforgettable, shareable roast quote under 140 chars that summarizes their coding persona perfectly",
  "score": 67,
  "scoreLabel": "Commit Chaos Survivor",
  "tip": "One genuinely useful but funny tip for them to improve"
}

Make each roast line reference SPECIFIC details from their profile (repo names, language choices, follower counts, etc). The bangerQuote must be quotable and tweet-worthy. Score should be 1-100 (be harsh but fair). Return ONLY valid JSON, no markdown fences.`;

        // Retry with backoff for 429 rate limiting
        let result;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                result = await model.generateContent(prompt);
                break;
            } catch (retryErr) {
                if (retryErr.status === 429 && attempt < 2) {
                    const waitSec = (attempt + 1) * 10;
                    console.log(`Rate limited, retrying in ${waitSec}s (attempt ${attempt + 1}/3)...`);
                    await new Promise(r => setTimeout(r, waitSec * 1000));
                } else {
                    throw retryErr;
                }
            }
        }

        const text = result.response.text().trim();

        // Parse JSON, stripping markdown fences if present
        const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
        const data = JSON.parse(cleaned);

        res.json(data);
    } catch (err) {
        console.error('Roast error:', err);
        const msg = err.status === 429
            ? 'Rate limited by Gemini API. Please wait a minute and try again.'
            : 'Failed to generate roast. Check your GEMINI_API_KEY.';
        res.status(500).json({ error: msg });
    }
});

export default router;
