import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Github } from 'lucide-react';
import Hero from '../components/Hero';

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
    const [isLoading, setIsLoading] = useState(false);
    const [pendingUsername, setPendingUsername] = useState('');
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    useGSAP(() => {
        if (isLoading && buttonRef.current) {
            gsap.to(buttonRef.current, {
                x: "+=4",
                duration: 0.08,
                repeat: 5,
                yoyo: true,
                ease: "power1.inOut",
                onComplete: () => {
                    navigate('/loading', { state: { username: pendingUsername, mode } });
                }
            });
        }
    }, [isLoading]);

    const handleRoast = (e) => {
        e.preventDefault();
        const clean = username.trim().replace('@', '');
        if (!clean) return setError('Enter a GitHub username first 👀');
        setError('');
        setPendingUsername(clean);
        setIsLoading(true);
    };

    const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

    return (
        <div className="landing">
            {/* Retro Decorative Elements */}
            <div className="pattern-dots" />
            <div className="corner-decor tl" />
            <div className="corner-decor tr" />
            <div className="corner-decor bl" />

            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-spacer" />
                <div className="nav-logo">
                    <img
                        src="/fire-logo.png"
                        alt="Fire Logo"
                        className="nav-fire-logo"
                    />
                    <span>YOUR GITHUB DESERVES A ROAST</span>
                </div>
                <div className="nav-links">
                    <a
                        href="https://github.com/DhirajB05"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-github-btn"
                        title="GitHub Profile"
                    >
                        <Github size={15} />
                        <span>GitHub</span>
                    </a>
                </div>
            </nav>

            {/* Awwwards-Caliber Neo-Brutalist Hero Section */}
            <Hero />

            {/* Input Card Scroll Reveal */}
            <motion.div
                className="input-card"
                style={{ animation: 'none' }}
                initial={{ opacity: 0, y: 24, rotate: -1.2 }}
                whileInView={{ opacity: 1, y: 0, rotate: -1.2 }}
                whileHover={{ rotate: 0, y: -2 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="input-card-fire-badge">🔥 ROAST ENGINE</div>
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
                            <motion.button
                                key={m.id}
                                type="button"
                                id={`mode-${m.id}`}
                                className={`mode-btn ${m.cls} ${mode === m.id ? 'active' : ''}`}
                                onClick={() => setMode(m.id)}
                                whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px #000" }}
                                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px #000" }}
                                animate={mode === m.id ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <span className="mode-emoji">{m.emoji}</span>
                                {m.label}
                            </motion.button>
                        ))}
                    </div>

                    <motion.button
                        ref={buttonRef}
                        id="roast-btn"
                        type="submit"
                        className="roast-btn"
                        disabled={isLoading}
                        whileHover={!isLoading ? { x: -2, y: -2, boxShadow: "6px 6px 0px #000" } : {}}
                        whileTap={!isLoading ? { x: 2, y: 2, boxShadow: "0px 0px 0px #000" } : {}}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        🔥 Roast Me !
                    </motion.button>
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
            </motion.div>

            {/* Social Proof Scroll Reveal */}
            <motion.div
                className="social-proof"
                style={{ animation: 'none' }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: 0.24 }}
            >
                <motion.div
                    className="stat-pill"
                    whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px #000" }}
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px #000" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <span className="stat-num">26</span>
                    <span className="stat-label">Meme Templates</span>
                </motion.div>
                <motion.div
                    className="stat-pill"
                    whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px #000" }}
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px #000" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <span className="stat-num">3</span>
                    <span className="stat-label">Roast Modes</span>
                </motion.div>
                <motion.div
                    className="stat-pill"
                    whileHover={{ x: -2, y: -2, boxShadow: "6px 6px 0px #000" }}
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px #000" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <span className="stat-num">∞</span>
                    <span className="stat-label">Tears Shed</span>
                </motion.div>
            </motion.div>
        </div>
    );
}
