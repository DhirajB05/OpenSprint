import express from 'express';
import fetch from 'node-fetch';

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
    sarcastic: `You are a sarcastic but brilliant tech lead who uses dry wit and irony. You're not mean, just deliciously sarcastic. Channel your inner snarky code reviewer who's had 4 espressos.`,
    savage: `You are an UNHINGED, absolutely FERAL AI roast comedian who makes the crowd GASP before they laugh. You are Gordon Ramsay reviewing spaghetti code, Simon Cowell watching a coding bootcamp demo, and a disappointed Indian dad seeing his kid chose humanities — ALL AT ONCE.

Your style:
- Make pop culture comparisons ("Your GitHub is like Fyre Festival — great marketing, zero delivery")
- Use hilariously specific analogies ("Your commit history reads like a ransom note — sporadic, desperate, and deeply unsettling")
- Reference meme culture ("Bro really said 'I know Python' and has 2 repos that print Hello World 💀")
- Weaponize their own data against them (exact numbers, repo names, follower counts)
- Each line should make them WHEEZE-laugh and then have an existential crisis
- Mix devastating burns with absurdist humor — be the love child of a roast battle champion and a shitpost lord
- Use Gen-Z/meme humor where appropriate ("not the ___ 💀", "bro thinks he's ___", "the audacity", "sir this is a Wendy's", "ratio")
- Every line should be SCREENSHOT-WORTHY. People should want to share these.
- NO generic jokes. Every single roast must reference THEIR specific profile data.
- The humor should be so brutal it circles back to being affectionate — like roasting your best friend at their wedding.`
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
            temperature: 1.0,
            max_tokens: 1536,
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
    "Line 1 with emoji - a DEVASTATING opener about their repos/stars. Use their actual repo names and numbers. Make it so specific it's scary.",
    "Line 2 with emoji - roast their star-to-repo ratio with a pop culture comparison (e.g., 'X stars across Y repos is like being employee of the month at a company that's going bankrupt')",
    "Line 3 with emoji - attack their account age vs output. If they've been on GitHub for years with little to show, DESTROY them. Use math to humiliate.",
    "Line 4 with emoji - roast their bio/README/repo descriptions or lack thereof. If they have 'Debugging one life at a time' in their bio, obliterate them for it.",
    "Line 5 with emoji - a WILDLY funny, absurd comparison. Compare their GitHub to something unexpected (a restaurant with no food, a gym membership never used, a résumé written in crayon, etc)",
    "Line 6 with emoji - THE KILL SHOT. The most quotable, screenshot-worthy, absolutely nuclear observation about their entire developer existence. This line alone should go viral."
  ],
  "bangerQuote": "A single DEVASTATING one-liner under 140 chars. This quote should make them laugh so hard they cry, then cry for real. Think viral tweet energy. Include their username or a specific detail.",
  "score": <calculate using the formula below>,
  "scoreLabel": "A FUNNY, quirky badge title — not generic. Examples: 'GitHub Tourist 🗺️', 'Ctrl+C Ctrl+Career 📋', 'Professional README Reader 📖', 'Git Blame's Favorite Target 🎯'",
  "tip": "One genuinely useful tip delivered in the most backhanded, savage way possible. Be helpful but make it sting."
}

SCORE FORMULA (calculate this precisely based on their ACTUAL data):
- Base: 30 points
- Stars: 0 = -10 | 1-5 = +0 | 6-20 = +5 | 21-100 = +10 | 100-500 = +15 | 500+ = +25
- Own repos (non-forks): 0-2 = -5 | 3-5 = +0 | 6-15 = +5 | 16-30 = +10 | 30+ = +15
- Fork ratio: >50% forks = -10
- Account age penalty: 3+ years with <5 own repos = -15 (they're just collecting dust)
- Followers: 0 = -10 | 1-5 = -5 | 6-20 = +0 | 21-100 = +5 | 100-500 = +10 | 500+ = +20
- Languages: only 1 = -5 | 2-3 = +0 | 4+ = +5
- README profile: has one = +5 | none = -5
- Cap between 1-100. Average devs = 15-45. Only legends score 60+. Beginners with empty repos = 10-25.

THIS PROFILE's DATA: ${githubData.totalStars} total stars, ${githubData.ownRepoCount} own repos out of ${githubData.publicRepos} total (${githubData.forkedCount} forks), ${githubData.followers} followers, ${githubData.accountAge} years on GitHub, languages: ${githubData.topLanguages.join(', ') || 'none'}. ${githubData.readme ? 'Has README.' : 'No README.'} CALCULATE THE SCORE HONESTLY.

CRITICAL RULES:
- Every roast line MUST mention specific data (repo names, exact numbers, languages used)
- The bangerQuote must be so brutal yet funny that someone would tweet it immediately
- NO generic developer jokes. Everything must be about THIS specific person's profile
- Use their bio against them if they have one
- If they have embarrassingly few stars/followers, mention the exact numbers
${mode === 'savage' ? '- THIS IS SAVAGE MODE. Your roast should make them consider deleting their GitHub account, switching to gardening as a career, and changing their name. Every line is a WAR CRIME against their coding self-esteem. Make them WHEEZE. Make them CRY. Make them screenshot it and send it to friends because it\'s THAT good.' : ''}
Return ONLY valid JSON, no markdown fences.`;

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
