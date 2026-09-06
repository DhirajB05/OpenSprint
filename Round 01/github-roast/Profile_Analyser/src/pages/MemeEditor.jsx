import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001';

// 26 viral meme templates (using emoji + colors as placeholders, rendered on canvas)
const TEMPLATES = [
    { id: 'drake', name: 'Drake Pointing', emoji: '🤚', color: '#1a1a2e', textColor: '#fff', layout: 'drake' },
    { id: 'distracted', name: 'Distracted BF', emoji: '👀', color: '#2d1b69', textColor: '#fff', layout: 'three' },
    { id: 'fine', name: 'This Is Fine', emoji: '🐕‍🦺', color: '#7c2d12', textColor: '#fff', layout: 'simple' },
    { id: 'gru', name: "Gru's Plan", emoji: '😤', color: '#14532d', textColor: '#fff', layout: 'fourpanel' },
    { id: 'twobuttons', name: 'Two Buttons', emoji: '😰', color: '#1e1b4b', textColor: '#fff', layout: 'simple' },
    { id: 'brain', name: 'Expanding Brain', emoji: '🧠', color: '#0f172a', textColor: '#fff', layout: 'simple' },
    { id: 'pikachu', name: 'Surprised Pikachu', emoji: '⚡', color: '#713f12', textColor: '#fff', layout: 'simple' },
    { id: 'cat', name: 'Woman Yelling at Cat', emoji: '🐱', color: '#1a1a1a', textColor: '#fff', layout: 'splitH' },
    { id: 'harold', name: 'Hide the Pain Harold', emoji: '😬', color: '#1c1917', textColor: '#fff', layout: 'simple' },
    { id: 'galaxy', name: 'Galaxy Brain', emoji: '🌌', color: '#0c0a09', textColor: '#fff', layout: 'simple' },
    { id: 'blink', name: 'Blinking White Guy', emoji: '😐', color: '#1a1a1a', textColor: '#fff', layout: 'simple' },
    { id: 'bernie', name: 'Bernie Sanders', emoji: '🧤', color: '#172554', textColor: '#fff', layout: 'simple' },
    { id: 'coffin', name: 'Coffin Dance', emoji: '⚰️', color: '#111827', textColor: '#fff', layout: 'simple' },
    { id: 'monkey', name: 'Monkey Puppet', emoji: '🐵', color: '#292524', textColor: '#fff', layout: 'simple' },
    { id: 'stonks', name: 'Stonks', emoji: '📈', color: '#052e16', textColor: '#fff', layout: 'simple' },
    { id: 'notstonks', name: 'Not Stonks', emoji: '📉', color: '#450a0a', textColor: '#fff', layout: 'simple' },
    { id: 'onenotsimp', name: 'One Does Not Simply', emoji: '🧙', color: '#1c1917', textColor: '#fff', layout: 'simple' },
    { id: 'changemind', name: 'Change My Mind', emoji: '🪑', color: '#27272a', textColor: '#fff', layout: 'simple' },
    { id: 'rollsafe', name: 'Roll Safe', emoji: '👉🧠', color: '#1a1a1a', textColor: '#fff', layout: 'simple' },
    { id: 'alwayshas', name: 'Always Has Been', emoji: '🔫', color: '#0c4a6e', textColor: '#fff', layout: 'splitH' },
    { id: 'spiderman', name: 'Spider-Man Pointing', emoji: '🕷️', color: '#450a0a', textColor: '#fff', layout: 'splitH' },
    { id: 'disaster', name: 'Disaster Girl', emoji: '🔥', color: '#431407', textColor: '#fff', layout: 'simple' },
    { id: 'doge', name: 'Doge', emoji: '🐕', color: '#fef3c7', textColor: '#92400e', layout: 'simple' },
    { id: 'leo', name: 'Leo DiCaprio Cheers', emoji: '🥂', color: '#1c1917', textColor: '#fff', layout: 'simple' },
    { id: 'kermit', name: 'Evil Kermit', emoji: '🐸', color: '#14532d', textColor: '#fff', layout: 'splitH' },
    { id: 'oprah', name: 'Oprah You Get A', emoji: '🎁', color: '#4c1d95', textColor: '#fff', layout: 'simple' },
];

function drawMeme(canvas, template, topText, bottomText) {
    if (!canvas || !template) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = template.color;
    ctx.fillRect(0, 0, W, H);

    // Draw big emoji as "image"
    ctx.font = `${H * 0.35}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(template.emoji, W / 2, H / 2);

    // Subtle overlay gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Meme text style (classic Impact look)
    const fontSize = Math.max(24, Math.min(40, W / 12));
    ctx.font = `900 ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;

    const drawText = (text, y) => {
        if (!text) return;
        const upper = text.toUpperCase();
        // Outline
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#fff';
        const lines = wrapText(ctx, upper, W - 40, W);
        let startY = y === 'top' ? fontSize + 10 : H - (lines.length * (fontSize + 6)) - 10;
        lines.forEach(line => {
            ctx.strokeText(line, W / 2, startY);
            ctx.fillText(line, W / 2, startY);
            startY += fontSize + 6;
        });
    };

    drawText(topText, 'top');
    drawText(bottomText, 'bottom');
}

function wrapText(ctx, text, maxWidth, canvasWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export default function MemeEditor() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [loadingCaption, setLoadingCaption] = useState(false);
    const [generated, setGenerated] = useState(false);

    const { githubData, roastData, mode } = state || {};

    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

    useEffect(() => {
        if (!selectedTemplate || !generated) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawMeme(canvas, selectedTemplate, topText, bottomText);
    }, [topText, bottomText, selectedTemplate, generated]);

    const handleGenerate = () => {
        if (!selectedTemplate) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        drawMeme(canvas, selectedTemplate, topText, bottomText);
        setGenerated(true);
    };

    const handleMagicCaption = async () => {
        if (!selectedTemplate) return;
        setLoadingCaption(true);
        try {
            const roastSummary = roastData?.roastLines?.join(' ') || '';
            const res = await axios.post(`${API}/api/meme/caption`, {
                template: selectedTemplate.name,
                roastSummary,
                archetype: roastData?.archetype,
                bangerQuote: roastData?.bangerQuote,
                topLanguages: githubData?.topLanguages,
            });
            setTopText(res.data.topText || '');
            setBottomText(res.data.bottomText || '');
        } catch (e) {
            setTopText('WRITES CODE AT 2AM');
            setBottomText('WONDERS WHY IT DOESN\'T WORK');
        }
        setLoadingCaption(false);
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `github-roast-meme-${githubData?.username || 'roast'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="meme-page">
            <div className="meme-inner">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button className="back-btn" onClick={() => navigate('/results', { state })}>
                        ← Back to Roast
                    </button>
                </div>

                <h1 className="page-title">🎨 Meme Generator</h1>
                <p className="page-sub">Choose a viral template, let AI write the caption, then download and post.</p>

                <div className="meme-layout">
                    {/* Template Picker */}
                    <div className="section-card">
                        <div className="section-title">📋 Pick a Meme Template</div>
                        <div className="template-grid">
                            {TEMPLATES.map(t => (
                                <div
                                    key={t.id}
                                    id={`meme-template-${t.id}`}
                                    className={`template-thumb ${selectedTemplate?.id === t.id ? 'selected' : ''}`}
                                    onClick={() => { setSelectedTemplate(t); setGenerated(false); }}
                                    style={{ background: t.color }}
                                >
                                    <span className="t-emoji">{t.emoji}</span>
                                    <span className="t-name" style={{ color: t.textColor, opacity: 0.85 }}>{t.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Meme Editor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="section-card">
                            <div className="section-title">✏️ Edit Caption</div>
                            <div className="text-inputs">
                                <div className="text-input-wrap">
                                    <label>TOP TEXT</label>
                                    <input
                                        id="meme-top-text"
                                        type="text"
                                        placeholder="WHEN YOUR BUILD FINALLY PASSES"
                                        value={topText}
                                        onChange={e => setTopText(e.target.value)}
                                    />
                                </div>
                                <div className="text-input-wrap">
                                    <label>BOTTOM TEXT</label>
                                    <input
                                        id="meme-bottom-text"
                                        type="text"
                                        placeholder="BUT YOU HAVE NO IDEA WHY"
                                        value={bottomText}
                                        onChange={e => setBottomText(e.target.value)}
                                    />
                                </div>
                                <button
                                    id="magic-caption-btn"
                                    className="magic-btn"
                                    onClick={handleMagicCaption}
                                    disabled={!selectedTemplate || loadingCaption}
                                >
                                    {loadingCaption ? '⏳ Generating...' : '✨ Magic Caption (AI)'}
                                </button>
                            </div>
                        </div>

                        <div className="section-card">
                            <div className="section-title">👁 Preview</div>
                            <div className="canvas-wrap">
                                {!selectedTemplate ? (
                                    <div className="canvas-placeholder">
                                        ← Select a meme template to get started
                                    </div>
                                ) : (
                                    <canvas
                                        id="meme-canvas"
                                        ref={canvasRef}
                                        width={500}
                                        height={400}
                                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                    />
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
                                <button
                                    id="generate-meme-btn"
                                    className="meme-btn generate"
                                    onClick={handleGenerate}
                                    disabled={!selectedTemplate}
                                >
                                    🎨 Render Meme
                                </button>
                                <button
                                    id="download-meme-btn"
                                    className="meme-btn download"
                                    onClick={handleDownload}
                                    disabled={!generated}
                                >
                                    ⬇️ Download PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
