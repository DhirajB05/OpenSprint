import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export default function RoastCard() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!state) navigate('/');
    }, [state, navigate]);

    if (!state) return null;

    const { githubData, roastData, mode } = state;
    const { archetype, bangerQuote, score, scoreLabel, roastLines } = roastData || {};

    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#FFD700' : '#ef4444';

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#09090b',
                scale: 2,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `roast-card-${githubData?.username}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error(e);
        }
        setDownloading(false);
    };

    const tweetText = encodeURIComponent(`Just got roasted by AI 🔥 Career Score: ${score}/100\n\n"${bangerQuote}"\n\n— GitHub Roast Machine`);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

    // Random accent lines for the card
    const cardLine1 = roastLines?.[0] || '';
    const cardLine2 = roastLines?.[1] || '';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '640px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <button className="back-btn" onClick={() => navigate('/results', { state })}>
                        ← Back to Roast
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>📸 Share-ready card</span>
                </div>

                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.4rem' }}>🃏 Your Roast Card</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                    Download this card and post it. You know you want to.
                </p>

                {/* THE CARD (this gets screenshotted) */}
                <div
                    ref={cardRef}
                    className="roast-card-export"
                    id="roast-card-export"
                    style={{
                        background: 'linear-gradient(135deg, #09090b 0%, #1a0a00 50%, #09090b 100%)',
                        border: '1px solid rgba(255,215,0,0.3)',
                        borderRadius: '20px',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                    }}
                >
                    {/* Decorative orbs */}
                    <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,215,0,0.06)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,107,0,0.05)', pointerEvents: 'none' }} />

                    {/* Logo row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,215,0,0.6)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            🔥 GitHub Roast Machine
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>
                            ai-generated
                        </span>
                    </div>

                    {/* Profile row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                        {githubData?.avatar && (
                            <img
                                src={githubData.avatar}
                                alt={githubData.username}
                                crossOrigin="anonymous"
                                style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(255,215,0,0.6)', flexShrink: 0 }}
                            />
                        )}
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{githubData?.name || githubData?.username}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>@{githubData?.username}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>/ 100</div>
                        </div>
                    </div>

                    {/* Archetype badge */}
                    {archetype && (
                        <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #FFD700, #FF6B00)', color: '#000', borderRadius: '99px', padding: '0.35rem 1rem', fontSize: '0.78rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                            {archetype}
                        </div>
                    )}

                    {/* Banger quote */}
                    {bangerQuote && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
                            <div style={{ fontSize: '2.5rem', color: 'rgba(255,215,0,0.15)', fontFamily: 'Georgia, serif', position: 'absolute', top: -8, left: 12, lineHeight: 1 }}>"</div>
                            <p style={{ fontSize: '0.95rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.6, color: '#fff', paddingTop: '0.25rem' }}>
                                {bangerQuote}
                            </p>
                        </div>
                    )}

                    {/* Two roast excerpts */}
                    {cardLine1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {[cardLine1, cardLine2].filter(Boolean).map((line, i) => (
                                <div key={i} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '2px solid rgba(255,215,0,0.4)' }}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats mini row */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        {[
                            [githubData?.publicRepos, 'Repos'],
                            [githubData?.totalStars, '⭐ Stars'],
                            [githubData?.topLanguages?.[0], 'Main Lang'],
                            [`${githubData?.accountAge}y`, 'On GitHub'],
                        ].map(([val, lbl]) => val !== undefined && (
                            <div key={lbl} style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFD700' }}>{val}</span>
                                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
                            </div>
                        ))}
                    </div>

                    {/* Score label */}
                    {scoreLabel && (
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                            Badge: <span style={{ color: 'rgba(255,215,0,0.6)' }}>{scoreLabel}</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'JetBrains Mono, monospace' }}>
                            github-roast-machine.app
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)' }}>
                            Roasted {new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Download / Share buttons */}
                <div className="action-grid" style={{ marginTop: '1.5rem' }}>
                    <button
                        id="download-card-btn"
                        className="action-btn primary"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? '⏳ Capturing...' : '⬇️ Download Card PNG'}
                    </button>
                    <a
                        id="share-card-twitter"
                        className="action-btn twitter"
                        href={tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        𝕏 Tweet This Card
                    </a>
                    <button
                        className="action-btn secondary"
                        onClick={() => navigate('/meme', { state })}
                    >
                        🎨 Create Meme Instead
                    </button>
                    <button
                        className="action-btn secondary"
                        onClick={() => navigate('/results', { state })}
                    >
                        ← Back to Roast
                    </button>
                </div>
            </div>
        </div>
    );
}
