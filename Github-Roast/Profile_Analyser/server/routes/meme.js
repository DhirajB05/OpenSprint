import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// ─── Curated viral meme templates (old + new classics) ───
const MEME_TEMPLATES = [
    { id: 'drake', name: 'Drake Hotline Bling', url: 'https://i.imgflip.com/30b1gx.jpg', format: 'top-bottom', desc: 'Top: thing you reject, Bottom: thing you prefer' },
    { id: 'distracted', name: 'Distracted Boyfriend', url: 'https://i.imgflip.com/1ur9b0.jpg', format: 'top-bottom', desc: 'Guy distracted by something while his girlfriend (the right choice) watches' },
    { id: 'change-mind', name: 'Change My Mind', url: 'https://i.imgflip.com/24y43o.jpg', format: 'bottom-only', desc: 'Bold statement on the sign, daring people to disagree' },
    { id: 'pikachu', name: 'Surprised Pikachu', url: 'https://i.imgflip.com/2kbn1e.jpg', format: 'top-bottom', desc: 'Top: does something obviously dumb, Bottom: surprised reaction' },
    { id: 'batman-slap', name: 'Batman Slapping Robin', url: 'https://i.imgflip.com/9ehk.jpg', format: 'top-bottom', desc: 'Robin says something, Batman slaps and corrects' },
    { id: 'this-is-fine', name: 'This Is Fine', url: 'https://i.imgflip.com/wxica.jpg', format: 'top-bottom', desc: 'Everything is on fire but pretending its fine' },
    { id: 'roll-safe', name: 'Roll Safe Think About It', url: 'https://i.imgflip.com/1h7in3.jpg', format: 'top-bottom', desc: 'Sarcastic "smart" galaxy brain logic' },
    { id: 'two-buttons', name: 'Two Buttons', url: 'https://i.imgflip.com/1g8my4.jpg', format: 'top-bottom', desc: 'Sweating over choosing between two options' },
    { id: 'one-does-not', name: 'One Does Not Simply', url: 'https://i.imgflip.com/1bij.jpg', format: 'top-bottom', desc: 'One does not simply [do something hard]' },
    { id: 'waiting-skeleton', name: 'Waiting Skeleton', url: 'https://i.imgflip.com/2fm6x.jpg', format: 'top-bottom', desc: 'Waiting forever for something that never happens' },
    { id: 'monkey-puppet', name: 'Monkey Puppet', url: 'https://i.imgflip.com/2gnnjh.jpg', format: 'top-bottom', desc: 'Awkward side-eye look when caught or uncomfortable' },
    { id: 'always-has-been', name: 'Always Has Been', url: 'https://i.imgflip.com/46e43q.png', format: 'top-bottom', desc: 'Wait its all X? Always has been' },
    { id: 'disaster-girl', name: 'Disaster Girl', url: 'https://i.imgflip.com/23ls.jpg', format: 'top-bottom', desc: 'Evil smile while everything burns behind' },
    { id: 'hide-pain', name: 'Hide the Pain Harold', url: 'https://i.imgflip.com/gk5el.jpg', format: 'top-bottom', desc: 'Smiling through pain and internal suffering' },
    { id: 'left-exit', name: 'Left Exit 12 Off Ramp', url: 'https://i.imgflip.com/22bdq6.jpg', format: 'top-bottom', desc: 'Car swerving to take the exit (choosing the worse option)' },
    { id: 'spongebob-mock', name: 'Mocking SpongeBob', url: 'https://i.imgflip.com/1otk96.jpg', format: 'top-bottom', desc: 'Mocking someone by repeating their words in alternating caps' },
    { id: 'is-this', name: 'Is This a Pigeon', url: 'https://i.imgflip.com/1o00in.jpg', format: 'top-bottom', desc: 'Pointing at something and completely misidentifying it' },
    { id: 'expanding-brain', name: 'Expanding Brain', url: 'https://i.imgflip.com/1jwhww.jpg', format: 'top-bottom', desc: 'Increasingly "enlightened" ideas (usually the worst ones)' },
    { id: 'boardroom', name: 'Boardroom Meeting', url: 'https://i.imgflip.com/39t1o.jpg', format: 'top-bottom', desc: 'Boss throws person out window for suggesting the right thing' },
    { id: 'stonks', name: 'Stonks', url: 'https://i.imgflip.com/261o3j.jpg', format: 'top-bottom', desc: 'Doing something dumb but calling it success' },
];

// ─── Groq API call ───
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
                { role: 'system', content: 'You are a JSON-only response bot. Return ONLY valid JSON arrays, no markdown fences, no explanation.' },
                { role: 'user', content: prompt }
            ],
            temperature: 1.0,
            max_tokens: 512,
        }),
    });

    if (!res.ok) throw new Error(`Groq API ${res.status}`);
    const json = await res.json();
    return json.choices[0].message.content.trim();
}

// ─── Route: Auto-generate 3 memes based on roast ───
router.post('/generate', async (req, res) => {
    const { archetype, bangerQuote, roastLines, topLanguages, username, score } = req.body;

    try {
        const templateList = MEME_TEMPLATES.map(t => `- "${t.name}": ${t.desc}`).join('\n');

        const prompt = `You are a viral meme genius. A developer named @${username} just got roasted on GitHub.

Their archetype: ${archetype}
Their score: ${score}/100
Their banger quote: "${bangerQuote}"
Their top languages: ${(topLanguages || []).join(', ')}
Some roast lines: ${(roastLines || []).slice(0, 3).join(' | ')}

Available meme templates:
${templateList}

Pick exactly 4 different meme templates that BEST match this developer's roast. For each, write SHORT, PUNCHY, VIRAL meme captions. Keep text under 60 chars per line. Make them genuinely funny — internet-native humor, dev jokes, stuff people would actually share.

Return a JSON array of exactly 4 objects:
[
  { "templateName": "exact name from list", "topText": "TOP LINE", "bottomText": "BOTTOM LINE / PUNCHLINE" },
  { "templateName": "exact name from list", "topText": "TOP LINE", "bottomText": "BOTTOM LINE" },
  { "templateName": "exact name from list", "topText": "TOP LINE", "bottomText": "BOTTOM LINE" },
  { "templateName": "exact name from list", "topText": "TOP LINE", "bottomText": "BOTTOM LINE" }
]

Return ONLY the JSON array.`;

        const text = await callGroq(prompt);
        // Robust JSON cleanup
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        if (jsonStart === -1 || jsonEnd === 0) throw new Error('Invalid JSON format from AI');
        const cleaned = text.slice(jsonStart, jsonEnd);
        const picks = JSON.parse(cleaned);

        // Map template names to URLs
        const memes = picks.slice(0, 4).map(pick => {
            const template = MEME_TEMPLATES.find(t =>
                t.name.toLowerCase() === pick.templateName.toLowerCase()
            ) || MEME_TEMPLATES[Math.floor(Math.random() * MEME_TEMPLATES.length)];

            return {
                templateName: template.name,
                imageUrl: template.url,
                topText: pick.topText || '',
                bottomText: pick.bottomText || '',
            };
        });

        res.json(memes);
    } catch (err) {
        console.error('Meme generation error:', err.message);
        // Fallback: return 3 random memes with generic dev captions
        const fallback = MEME_TEMPLATES
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(t => ({
                templateName: t.name,
                imageUrl: t.url,
                topText: `WHEN YOUR GITHUB SCORE IS ${req.body.score || '??'}`,
                bottomText: 'AND YOU STILL CALL YOURSELF A DEVELOPER',
            }));
        res.json(fallback);
    }
});

export default router;
