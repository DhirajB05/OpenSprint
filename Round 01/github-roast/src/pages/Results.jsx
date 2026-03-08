import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.DEV ? 'http://localhost:3001' : '';

const SCORE_COLORS = {
    high: '#22c55e',   // 70+
    mid: '#FFD700',    // 40-69
    low: '#ef4444',    // <40
};

function ScoreRing({ score }) {
    const r = 32;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const color = score >= 70 ? SCORE_COLORS.high : score >= 40 ? SCORE_COLORS.mid : SCORE_COLORS.low;

    return (
        <div className="score-ring-wrap">
            <div className="score-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle className="bg-circle" cx="40" cy="40" r={r} />
                    <circle
                        className="fg-circle"
                        cx="40" cy="40" r={r}
                        stroke={color}
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="score-center" style={{ color }}>
                    {score}
                </div>
            </div>
            <div className="score-lbl">Career Score</div>
        </div>
    );
}

/* ─── Meme Card with CSS text overlay ─── */
function MemeCard({ meme }) {
    return (
        <div className="meme-card">
            <div className="meme-image-wrap">
                <img src={meme.imageUrl} alt={meme.templateName} className="meme-img" crossOrigin="anonymous" />
                {meme.topText && (
                    <div className="meme-text meme-text-top">{meme.topText}</div>
                )}
                {meme.bottomText && (
                    <div className="meme-text meme-text-bottom">{meme.bottomText}</div>
                )}
            </div>
            <div className="meme-template-name">{meme.templateName}</div>
        </div>
    );
}

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [memes, setMemes] = useState([]);
    const [memesLoading, setMemesLoading] = useState(false);
    const hasFetchedMemes = useRef(false);

    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

    // Auto-fetch memes when roast data is available
    useEffect(() => {
        if (!state?.roastData || hasFetchedMemes.current) return;
        hasFetchedMemes.current = true;

        const fetchMemes = async () => {
            setMemesLoading(true);
            try {
                const res = await axios.post(`${API}/api/meme/generate`, {
                    archetype: state.roastData.archetype,
                    bangerQuote: state.roastData.bangerQuote,
                    roastLines: state.roastData.roastLines,
                    topLanguages: state.githubData?.topLanguages,
                    username: state.githubData?.username,
                    score: state.roastData.score,
                });
                setMemes(res.data);
            } catch (err) {
                console.error('Failed to load memes:', err);
            }
            setMemesLoading(false);
        };

        fetchMemes();
    }, [state]);

    if (!state) return null;

    const { githubData, roastData, mode, error, username } = state;

    if (error) {
        return (
            <div className="results">
                <div className="results-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😬</div>
                    <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Roast Failed</h2>
                    <div className="error-box" style={{ maxWidth: 480, textAlign: 'center' }}>
                        {error}
                        {error.includes('GROQ_API_KEY') && (
                            <div style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.82rem' }}>
                                💡 Add your GROQ_API_KEY to <code>server/.env</code> and restart the server.
                            </div>
                        )}
                        {error.toLowerCase().includes('rate limit') && (
                            <div style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.82rem' }}>
                                ⏳ Free tier quota exceeded. Wait ~60 seconds and try again.
                            </div>
                        )}
                        {error.includes('not found') && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.82rem' }}>
                                GitHub user <strong>@{username}</strong> doesn't exist. Check the spelling.
                            </div>
                        )}
                    </div>
                    <button className="action-btn secondary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/')}>
                        ← Try Another Username
                    </button>
                </div>
            </div>
        );
    }

    const { archetype, roastLines = [], bangerQuote, score, scoreLabel, tip } = roastData || {};

    const tweetText = encodeURIComponent(`Just got roasted by AI 🔥\n\n"${bangerQuote}"\n\n— GitHub Roast Machine`);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    const liText = encodeURIComponent(`My GitHub profile just got roasted by AI 😅\n\nArchetype: ${archetype}\n\n"${bangerQuote}"\n\nCareer Score: ${score}/100`);
    const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&title=GitHub+Roast&summary=${liText}`;

    return (
        <div className="results">
            <div className="results-inner">
                {/* Header */}
                <div className="results-header">
                    <button className="back-btn" onClick={() => navigate('/')} id="back-btn">
                        ← New Roast
                    </button>
                    <span className={`mode-badge ${mode}`}>
                        {mode === 'friendly' ? '🤝 Friendly' : mode === 'sarcastic' ? '😏 Sarcastic' : '🔥 Savage'} Mode
                    </span>
                </div>

                {/* Profile Hero */}
                <div className="profile-hero">
                    <div className="avatar-wrap animate-bounce-in">
                        {githubData?.avatar && (
                            <img src={githubData.avatar} alt={githubData.username} className="avatar-img" crossOrigin="anonymous" />
                        )}
                        {archetype && <div className="archetype-tag">{archetype}</div>}
                    </div>
                    <div className="profile-meta">
                        <div className="profile-name">{githubData?.name || githubData?.username}</div>
                        <div className="profile-username">@{githubData?.username}</div>
                        <div className="profile-stats">
                            <div className="pstat">
                                <span className="pstat-num">{githubData?.publicRepos}</span>
                                <span className="pstat-lbl">Repos</span>
                            </div>
                            <div className="pstat">
                                <span className="pstat-num">{githubData?.totalStars}</span>
                                <span className="pstat-lbl">Stars</span>
                            </div>
                            <div className="pstat">
                                <span className="pstat-num">{githubData?.followers}</span>
                                <span className="pstat-lbl">Followers</span>
                            </div>
                            <div className="pstat">
                                <span className="pstat-num">{githubData?.accountAge}y</span>
                                <span className="pstat-lbl">On GitHub</span>
                            </div>
                        </div>
                    </div>
                    {score !== undefined && <ScoreRing score={score} />}
                </div>

                {/* Roast Lines */}
                {roastLines.length > 0 && (
                    <div className="roast-card">
                        <div className="roast-card-title">🔥 The Roast</div>
                        <div className="roast-lines">
                            {roastLines.map((line, i) => {
                                const emojiMatch = line.match(/^(\p{Emoji})/u);
                                const emoji = emojiMatch ? emojiMatch[1] : '💀';
                                const text = line.replace(/^(\p{Emoji}\s*)/u, '');
                                return (
                                    <div key={i} className="roast-line" style={{ animationDelay: `${i * 100}ms` }}>
                                        <span className="roast-line-emoji">{emoji}</span>
                                        <span>{text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Banger Quote */}
                {bangerQuote && (
                    <div className="banger-quote">
                        <p className="banger-text">{bangerQuote}</p>
                        <p className="banger-hint">⬆️ Your banger quote — screenshot and post this</p>
                    </div>
                )}

                {/* ─── AUTO-GENERATED MEMES ─── */}
                <div className="memes-section">
                    <div className="memes-section-title">🎭 Your Roast Memes</div>
                    <p className="memes-section-sub">AI picked the perfect memes for your roast. Screenshot & share!</p>

                    {memesLoading ? (
                        <div className="memes-loading">
                            <div className="meme-spinner" />
                            <span>Generating your memes...</span>
                        </div>
                    ) : memes.length > 0 ? (
                        <div className="memes-grid">
                            {memes.map((meme, i) => (
                                <MemeCard key={i} meme={meme} />
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Tip */}
                {tip && (
                    <div className="tip-box">
                        <div className="tip-title">💡 AI's Actual Advice</div>
                        {tip}
                    </div>
                )}

                {/* Score label */}
                {scoreLabel && (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.25rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        Badge unlocked: <strong style={{ color: 'var(--accent)' }}>{scoreLabel}</strong>
                    </div>
                )}

                {/* Actions */}
                <div className="action-grid">
                    <button
                        id="roast-card-btn"
                        className="action-btn primary"
                        onClick={() => navigate('/card', { state: { githubData, roastData, mode } })}
                    >
                        🃏 Roast Card
                    </button>
                    <a
                        id="share-twitter-btn"
                        className="action-btn twitter"
                        href={tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        𝕏 Share on X
                    </a>
                    <a
                        id="share-linkedin-btn"
                        className="action-btn linkedin"
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        in Share on LinkedIn
                    </a>
                    <button
                        className="action-btn secondary"
                        onClick={() => navigate('/')}
                    >
                        🔁 Roast Someone Else
                    </button>
                </div>
            </div>
        </div>
    );
}
