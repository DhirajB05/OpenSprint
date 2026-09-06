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

// ─── Supported Groq Models with Auto-Fallback ───
const CANDIDATE_MODELS = [
    process.env.GROQ_MODEL,
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
].filter(Boolean);

// ─── Groq API call (OpenAI-compatible) ───
async function callGroq(prompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    let lastError = null;
    for (const model of CANDIDATE_MODELS) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
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
                if (res.status === 404 || err.includes('model_not_found')) {
                    console.warn(`⚠️ Groq model ${model} not found, trying next candidate...`);
                    lastError = new Error(`Groq API ${res.status}: ${err}`);
                    continue;
                }
                throw new Error(`Groq API ${res.status}: ${err}`);
            }

            const json = await res.json();
            return json.choices[0].message.content.trim();
        } catch (err) {
            lastError = err;
            if (err.message && err.message.includes('model_not_found')) continue;
            throw err;
        }
    }
    throw lastError || new Error('All candidate Groq models failed');
}

// ─── Robust JSON Parser ───
function extractJSON(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end <= start) {
        throw new Error('No valid JSON object found in AI response');
    }
    return JSON.parse(text.slice(start, end));
}

// ─── Heuristic Fallback Roast Generator ───
function generateFallbackRoast(githubData, mode = 'savage') {
    const username = githubData.username || 'developer';
    const stars = githubData.totalStars || 0;
    const ownRepos = githubData.ownRepoCount || 0;
    const totalRepos = githubData.publicRepos || ownRepos;
    const forks = githubData.forkedCount || 0;
    const age = githubData.accountAge || 1;
    const followers = githubData.followers || 0;
    const languages = githubData.topLanguages || [];
    const topLang = languages[0] || 'JavaScript';
    const repoNames = githubData.repoNames || [];
    const sampleRepo = repoNames[0] || 'hello-world';

    // Calculate score
    let score = 30;
    if (stars === 0) score -= 10;
    else if (stars <= 5) score += 0;
    else if (stars <= 20) score += 5;
    else if (stars <= 100) score += 10;
    else if (stars <= 500) score += 15;
    else score += 25;

    if (ownRepos <= 2) score -= 5;
    else if (ownRepos <= 5) score += 0;
    else if (ownRepos <= 15) score += 5;
    else if (ownRepos <= 30) score += 10;
    else score += 15;

    if (totalRepos > 0 && (forks / totalRepos) > 0.5) score -= 10;
    if (age >= 3 && ownRepos < 5) score -= 15;

    if (followers === 0) score -= 10;
    else if (followers <= 5) score -= 5;
    else if (followers <= 20) score += 0;
    else if (followers <= 100) score += 5;
    else if (followers <= 500) score += 10;
    else score += 20;

    if (languages.length <= 1) score -= 5;
    else if (languages.length <= 3) score += 0;
    else score += 5;

    if (githubData.readme) score += 5;
    else score -= 5;

    score = Math.max(5, Math.min(99, score));

    // Archetype
    let archetype = 'Tutorial Hoarder 📚';
    if (forks > ownRepos) archetype = 'Fork Collector 🍴';
    else if (stars === 0 && ownRepos > 5) archetype = 'Star Chaser ⭐';
    else if (age >= 3 && ownRepos < 5) archetype = 'The Ghost Committer 👻';
    else if (languages.length === 1) archetype = 'One-Language Wonder 🎯';
    else if (ownRepos > 20) archetype = 'Serial Abandonist 🏃';
    else if (score < 25) archetype = 'The Eternal Beginner 🌱';

    // Score label
    let scoreLabel = 'GitHub Tourist 🗺️';
    if (score >= 80) scoreLabel = 'Certified 10x Legend 🏆';
    else if (score >= 60) scoreLabel = 'Senior Ctrl+C Architect 💼';
    else if (score >= 40) scoreLabel = 'Git Blame Target 🎯';
    else if (score >= 25) scoreLabel = 'Professional README Reader 📖';

    // Roast lines
    const roastLines = [
        `📦 ${ownRepos} original repos out of ${totalRepos}. The rest are just forks you clicked on at 3 AM and forgot existed.`,
        `⭐ ${stars} total stars across ${totalRepos} repos. A blank README on Twitter gets higher organic engagement than this profile.`,
        `⏳ ${age} years on GitHub and your most active commit streak was fixing a typo in your own username.`,
        `💻 Primary language: ${topLang}. Looks like 90% of your codebase is copy-pasted directly from Stack Overflow answers.`,
        `📁 Repos like "${sampleRepo}" looking like archaeological ruins of abandoned weekend motivation.`,
        `💀 The audit concluded: @${username}'s commit graph looks like Morse code signaling for immediate help.`
    ];

    const bangerQuote = stars > 500
        ? `@${username} has ${stars} stars but still commits with messages like 'fixed stuff pls work' 💀`
        : `Bro has ${stars} stars across ${totalRepos} repos and calls himself a software architect 💀`;

    const tip = `Pick one repo, like "${sampleRepo}", and actually finish it before creating 10 more empty directories.`;

    return {
        archetype,
        roastLines,
        bangerQuote,
        score,
        scoreLabel,
        tip
    };
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

        let data = null;
        try {
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
  "scoreLabel": "A FUNNY, quirky badge title — not generic. Examples: 'GitHub Tourist 🗺️', 'Ctrl+C Ctrl+Career 📋', 'Professional README Reader 📖', 'Git Blame\\'s Favorite Target 🎯'",
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
            data = extractJSON(text);
        } catch (aiErr) {
            console.warn('⚠️ AI roast generation failed, using intelligent fallback:', aiErr.message);
            data = generateFallbackRoast(githubData, mode);
        }

        // 5. Cache the result (24h TTL)
        await setInCache(cacheKey, data);
        console.log(`💾 Cached roast for @${githubData.username} (${mode})`);

        res.json(data);
    } catch (err) {
        console.error('Roast route error:', err.message);
        res.json(generateFallbackRoast(githubData, mode));
    }
});

export default router;
