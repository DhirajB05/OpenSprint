import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

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

export default function Results() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const hasInit = useRef(false);

    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

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
                        {error.includes('GEMINI_API_KEY') && (
                            <div style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.82rem' }}>
                                💡 Add your GEMINI_API_KEY to <code>server/.env</code> and restart the server.
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
                        id="create-meme-btn"
                        className="action-btn primary"
                        onClick={() => navigate('/meme', { state: { githubData, roastData, mode } })}
                    >
                        🎨 Create Meme
                    </button>
                    <button
                        id="roast-card-btn"
                        className="action-btn secondary"
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
                </div>
            </div>
        </div>
    );
}
