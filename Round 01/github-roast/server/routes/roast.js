import express from 'express';

const router = express.Router();

// ─── In-memory cache with TTL (no external dependency needed) ───
// Stores roasts keyed by "username:mode" with 24h expiry
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.exp) { cache.delete(key); return null; }
    return entry.data;
}

function cacheSet(key, data) {
    cache.set(key, { data, exp: Date.now() + CACHE_TTL });
}

// Optional: Vercel KV (Redis) for production — set KV_REST_API_URL + KV_REST_API_TOKEN
let kv = null;
async function initKV() {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            const { kv: vercelKV } = await import('@vercel/kv');
            kv = vercelKV;
            console.log('✅ Using Vercel KV (Redis) cache');
        } catch { /* fallback to in-memory */ }
    }
    if (!kv) console.log('📦 Using in-memory cache (24h TTL)');
}
initKV();

async function getFromCache(key) {
    if (kv) {
        try { return await kv.get(key); } catch { return cacheGet(key); }
    }
    return cacheGet(key);
}

async function setInCache(key, data) {
    if (kv) {
        try { await kv.set(key, data, { ex: 86400 }); return; } catch { /* fallback */ }
    }
    cacheSet(key, data);
}

// ─── Archetypes & Mode Prompts ───
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

// ─── Groq API call (OpenAI-compatible) ───
async function callGroq(prompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a JSON-only response bot. Return ONLY valid JSON, no markdown fences, no explanation.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 1024,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API ${res.status}: ${err}`);
    }

    const json = await res.json();
    return json.choices[0].message.content.trim();
}

// ─── Route ───
router.post('/', async (req, res) => {
    const { githubData, mode = 'savage' } = req.body;
    if (!githubData) return res.status(400).json({ error: 'No GitHub data provided' });

    const cacheKey = `roast:${githubData.username}:${mode}`;

    try {
        // 1. Check cache first
        const cached = await getFromCache(cacheKey);
        if (cached) {
            console.log(`⚡ Cache hit for @${githubData.username} (${mode})`);
            return res.json(cached);
        }

        console.log(`🔥 Generating fresh roast for @${githubData.username} (${mode})`);

        // 2. Build prompt
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

        // 3. Call Groq API
        const text = await callGroq(prompt);

        // 4. Parse JSON
        const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
        const data = JSON.parse(cleaned);

        // 5. Cache the result (24h TTL)
        await setInCache(cacheKey, data);
        console.log(`💾 Cached roast for @${githubData.username} (${mode})`);

        res.json(data);
    } catch (err) {
        console.error('Roast error:', err.message);
        const msg = err.message.includes('GROQ_API_KEY')
            ? 'GROQ_API_KEY not configured. Add it to server/.env'
            : err.message.includes('429')
                ? 'Rate limited. Please wait a moment and try again.'
                : 'Failed to generate roast. Check server logs.';
        res.status(500).json({ error: msg });
    }
});

export default router;
