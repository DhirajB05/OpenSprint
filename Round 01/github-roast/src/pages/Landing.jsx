import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TIPS = [
    '🔥 Pro tip: "fix" is a valid commit message. So is "aaaa".',
    '😅 Fun fact: The average developer Googles the same thing 47 times.',
    '🌙 Did you know? 73% of "works on my machine" bugs are never fixed.',
    '🤡 "I\'ll add tests later" is the developer\'s version of "I\'ll go to the gym tomorrow".',
    '🧙 Every senior dev has a graveyard of projects called "untitled-final-v2".',
    '☕ The code quality is directly proportional to caffeine levels.',
    '📦 node_modules is heavier than a black hole. Science agrees.',
];

export default function Landing() {
    const [username, setUsername] = useState('');
    const [mode, setMode] = useState('savage');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRoast = (e) => {
        e.preventDefault();
        const clean = username.trim().replace('@', '');
        if (!clean) return setError('Enter a GitHub username first 👀');
        setError('');
        navigate('/loading', { state: { username: clean, mode } });
    };

    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

    return (
        <div className="landing">
            {/* Retro Decorative Elements */}
            <div className="pattern-dots" />
            <div className="corner-decor tl" />
            <div className="corner-decor tr" />
            <div className="corner-decor bl" />

            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-logo">
                    <span className="dot" style={{ background: '#FF6B2C' }} />
                    <span className="dot" style={{ background: '#2DB84B' }} />
                    <span className="dot" style={{ background: '#7B5EA7' }} />
                    ROAST · MACHINE
                </div>
                <div className="nav-links">
                    <span className="nav-link active">Roast</span>
                    <span className="nav-link">Meme</span>
                    <span className="nav-link">About</span>
                </div>
            </nav>

            <div className="hero-badge">
                ⚡ AI-Powered GitHub Roaster
            </div>

            <h1 className="hero-title">
                Your GitHub
                <br />
                <span className="gradient">Deserves A Roast</span>
            </h1>

            <p className="hero-sub">
                Drop any GitHub username and watch AI brutally (but lovingly) tear apart your commit history, empty repos, and questionable tech choices.
            </p>

            <div className="input-card">
                {error && <div className="error-box">⚠️ {error}</div>}

                <form onSubmit={handleRoast}>
                    <label className="input-label">GitHub Username</label>
                    <div className="input-wrap">
                        <span className="input-icon">🐙</span>
                        <input
                            id="github-username"
                            className="input-field"
                            type="text"
                            placeholder="torvalds"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>

                    <label className="mode-label">🎭 Choose Your Roast Mode</label>
                    <div className="mode-grid">
                        {[
                            { id: 'friendly', emoji: '🤝', label: 'Friendly', cls: 'friendly-mode' },
                            { id: 'sarcastic', emoji: '😏', label: 'Sarcastic', cls: 'sarcastic-mode' },
                            { id: 'savage', emoji: '🔥', label: 'Savage', cls: 'savage-mode' },
                        ].map(m => (
                            <button
                                key={m.id}
                                type="button"
                                id={`mode-${m.id}`}
                                className={`mode-btn ${m.cls} ${mode === m.id ? 'active' : ''}`}
                                onClick={() => setMode(m.id)}
                            >
                                <span className="mode-emoji">{m.emoji}</span>
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <button id="roast-btn" type="submit" className="roast-btn">
                        🔥 Roast Me !
                    </button>
                </form>

                <p className="landing-hint">
                    Try:{' '}
                    <span style={{ color: 'var(--orange)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setUsername('torvalds')}>torvalds</span>
                    {' · '}
                    <span style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setUsername('gaearon')}>gaearon</span>
                    {' · '}
                    <span style={{ color: 'var(--purple)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setUsername('sindresorhus')}>sindresorhus</span>
                </p>

                <div className="loading-tip" style={{ marginTop: '1rem' }}>
                    {tip}
                </div>
            </div>

            <div className="social-proof">
                <div className="stat-pill">
                    <span className="stat-num">26</span>
                    <span className="stat-label">Meme Templates</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-num">3</span>
                    <span className="stat-label">Roast Modes</span>
                </div>
                <div className="stat-pill">
                    <span className="stat-num">∞</span>
                    <span className="stat-label">Tears Shed</span>
                </div>
            </div>
        </div>
    );
}
