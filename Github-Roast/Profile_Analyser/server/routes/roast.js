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

// ─── Procedural Fallback Roast (Used if Groq fails or rate limits) ───
function generateFallbackRoast(githubData, mode = 'savage') {
    const stars = githubData.totalStars || 0;
    const repos = githubData.ownRepoCount || githubData.publicRepos || 0;
    const totalRepos = githubData.publicRepos || 0;
    const forks = githubData.forkedCount || 0;
    const followers = githubData.followers || 0;
    const topLang = (githubData.topLanguages && githubData.topLanguages[0]) || 'code';
    const age = githubData.accountAge || 1;
    const sampleRepo = (githubData.topRepos && githubData.topRepos[0]?.name) || (githubData.repoNames && githubData.repoNames[0]) || 'my-project';

    const archetypes = {
        friendly: 'Hopeful Dreamer 🌱',
        sarcastic: 'Git Blame Target 🎯',
        savage: forks > totalRepos * 0.4 ? 'Fork Collector 🍴' : stars < 5 ? 'Tutorial Hoarder 📚' : 'Serial Abandonist 🏃'
    };

    const roastLines = [
        `🐙 @${githubData.username} has ${totalRepos} repos and ${stars} stars — that's not an active portfolio, that's an open-source memorial.`,
        `⭐ ${stars} stars across ${totalRepos} repositories is like being employee of the month at a company that went out of business.`,
        `⏳ ${age} year${age > 1 ? 's' : ''} on GitHub and repos like "${sampleRepo}" are collecting more digital dust than actual commits.`,
        `📝 Bio: "${githubData.bio || 'None'}" — keeping it empty is smart, admitting what you actually build would just raise questions.`,
        `💻 Writing ${topLang} with this commit cadence is like claiming you're an athlete because you bought running shoes once.`,
        `💀 THE KILL SHOT: If your repositories could file for abandonment, you'd be served with a court summons tomorrow.`
    ];

    const quotes = [
        `@${githubData.username}'s GitHub is like a gym membership — paid for, bragged about, but never actually used.`,
        `Rumor has it @${githubData.username}'s favorite git command is 'git push --force' followed by immediate regret.`,
        `47 abandoned projects and 0 unit tests — @${githubData.username}'s profile is an escalating cry for help.`
    ];

    const calculatedScore = Math.max(15, Math.min(88, Math.round(
        30 + (stars > 100 ? 30 : stars > 20 ? 15 : stars > 5 ? 5 : -10)
        + (repos > 20 ? 15 : repos > 5 ? 5 : -5)
        + (followers > 50 ? 15 : followers > 10 ? 5 : -5)
        - (forks > totalRepos * 0.5 ? 10 : 0)
    )));

    return {
        archetype: archetypes[mode] || archetypes.savage,
        roastLines,
        bangerQuote: quotes[Math.floor(Math.random() * quotes.length)],
        score: calculatedScore,
        scoreLabel: calculatedScore > 65 ? 'Certified Overachiever 🏆' : calculatedScore > 40 ? 'Professional README Reader 📖' : 'GitHub Tourist 🗺️',
        tip: `Push actual working code this week instead of tweaking README formatting for the 14th time.`
    };
}

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
                { role: 'system', content: 'You are a JSON-only response bot. You MUST return ONLY valid JSON with no markdown fences, no backticks, and no extra commentary.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.8,
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

function extractJSON(text) {
    if (!text) throw new Error('Empty response from AI');
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (_) {}

    // Clean any markdown fences
    const stripped = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(stripped);
    } catch (_) {}

    // Find JSON boundary braces
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const sub = stripped.slice(firstBrace, lastBrace + 1);
        try {
            return JSON.parse(sub);
        } catch (_) {}
    }

    throw new Error('Unable to parse JSON from AI response');
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
Name: ${githubData.name || githubData.username}
Bio: ${githubData.bio || 'None (suspicious)'}
Account Age: ${githubData.accountAge || 1} years
Public Repos: ${githubData.publicRepos || 0} (${githubData.forkedCount || 0} are forks)
Own Repos: ${githubData.ownRepoCount || 0}
Total Stars: ${githubData.totalStars || 0}
Followers: ${githubData.followers || 0} | Following: ${githubData.following || 0}
Top Languages: ${(githubData.topLanguages || []).join(', ') || 'None detected'}
Top Repos: ${(githubData.topRepos || []).map(r => `${r.name} (⭐${r.stars || 0}, ${r.lang || 'code'}): ${r.description || 'no description'}`).join(' | ') || 'None'}
Some repo names: ${(githubData.repoNames || []).slice(0, 10).join(', ') || 'None'}
Location: ${githubData.location || 'Unknown'}

Generate a JSON response with this EXACT structure:
{
  "archetype": "One matching archetype from: ${ARCHETYPES.join(', ')}",
  "roastLines": [
    "Line 1 with emoji - roast their repos/stars with specific details",
    "Line 2 with emoji - roast star-to-repo ratio with a hilarious analogy",
    "Line 3 with emoji - attack account age vs output",
    "Line 4 with emoji - roast their bio/descriptions",
    "Line 5 with emoji - wildly funny comparison",
    "Line 6 with emoji - THE KILL SHOT: most viral, screenshot-worthy observation"
  ],
  "bangerQuote": "A single DEVASTATING viral quote under 140 chars referencing @${githubData.username}.",
  "score": 35,
  "scoreLabel": "A funny quirky badge title",
  "tip": "One useful tip delivered in a backhanded, savage way."
}

CRITICAL: Return ONLY valid JSON, no markdown fences.`;

        // 3. Call Groq API
        const text = await callGroq(prompt);

        // 4. Parse JSON
        const data = extractJSON(text);

        // 5. Cache the result (24h TTL)
        await setInCache(cacheKey, data);
        console.log(`💾 Cached roast for @${githubData.username} (${mode})`);

        res.json(data);
    } catch (err) {
        console.error('Roast error:', err.message);
        
        // Fallback: If AI call or parse fails, deliver high-quality procedural roast instead of breaking
        try {
            console.log(`🛡️ Serving procedural fallback roast for @${githubData.username}`);
            const fallback = generateFallbackRoast(githubData, mode);
            await setInCache(cacheKey, fallback);
            return res.json(fallback);
        } catch (fallbackErr) {
            console.error('Fallback error:', fallbackErr.message);
            res.status(500).json({ error: 'Failed to generate roast: ' + err.message });
        }
    }
});

export default router;
