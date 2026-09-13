import { motion, useReducedMotion } from 'framer-motion';

/**
 * HEADLINE ALTERNATE OPTIONS (Neo-Brutalist):
 * --------------------------------------------------------------------------
 * Choice 1 (Active Default):
 *   Line 1: YOUR GITHUB
 *   Line 2: NEEDS TO BE HUMBLED
 *
 * Choice 2:
 *   Line 1: YOUR GITHUB
 *   Line 2: IS AN ACCIDENTAL COMEDY
 *
 * Choice 3:
 *   Line 1: YOUR GITHUB
 *   Line 2: DESERVES A SKEWERING
 *
 * Baseline Reference:
 *   Line 1: YOUR GITHUB
 *   Line 2: DESERVES A ROAST
 * --------------------------------------------------------------------------
 */

// Patchy commit grid reflecting an abandoned tutorial collector history
const COMMIT_SAMPLE = [
    '#2DB84B', '#EDE7DA', '#166534', '#EDE7DA', '#22c55e', '#EDE7DA', '#EDE7DA',
    '#2DB84B', '#EDE7DA', '#FF6B2C', '#22c55e', '#EDE7DA', '#166534', '#EDE7DA',
    '#EDE7DA', '#EDE7DA', '#2DB84B', '#EDE7DA', '#EDE7DA', '#166534', '#22c55e',
    '#EDE7DA', '#2DB84B', '#EDE7DA', '#EDE7DA', '#FF6B2C', '#EDE7DA', '#2DB84B',
];

export default function Hero() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <section className="hero-section" aria-label="Hero Section">
            <div className="hero-grid">
                {/* Left Column: Asymmetric Editorial Stack */}
                <div className="hero-left">
                    {/* Eyebrow Badge — Single intentional misalignment (-2deg rotation) */}
                    <motion.div
                        className="hero-badge"
                        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        ⚡ AI-Powered GitHub Roaster
                    </motion.div>

                    {/* Headline with fluid clamp scaling */}
                    <h1 className="hero-title">
                        <motion.span
                            className="hero-title-line-1"
                            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            Your GitHub
                        </motion.span>
                        <motion.span
                            className="hero-title-line-2"
                            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Needs To Be Humbled
                        </motion.span>
                    </h1>

                    {/* Tightened 2-Line Subheading */}
                    <motion.p
                        className="hero-sub"
                        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.35 }}
                    >
                        Drop any GitHub username. Our AI strips the illusion from your commit history, ghost repos, and questionable tech choices.
                    </motion.p>
                </div>

                {/* Right Column: Brutalist Roast-Preview Card */}
                <div className="hero-right">
                    <motion.aside
                        className="roast-preview-card"
                        aria-label="Live Sample Roast Card Preview"
                        initial={shouldReduceMotion ? { opacity: 1, x: 0, rotate: -1.5 } : { opacity: 0, x: 40, rotate: 4 }}
                        animate={{ opacity: 1, x: 0, rotate: -1.5 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.3 }}
                        whileHover={{ rotate: 0, x: -2, y: -2, boxShadow: '9px 9px 0px #000' }}
                    >
                        {/* Retro Window Title Bar */}
                        <div className="preview-header">
                            <div className="preview-dots" aria-hidden="true">
                                <span className="preview-dot" />
                                <span className="preview-dot" />
                                <span className="preview-dot" />
                            </div>
                            <span style={{ color: 'var(--dark)' }}>roast_preview.sh</span>
                            <span className="preview-tag">● LIVE SAMPLE</span>
                        </div>

                        {/* Card Content Body */}
                        <div className="preview-body">
                            {/* Profile Bar */}
                            <div className="preview-profile">
                                <div className="preview-avatar" aria-hidden="true">
                                    👾
                                </div>
                                <div className="preview-user-info">
                                    <div className="preview-username">@torvalds-wannabe</div>
                                    <div className="preview-score">SCORE: 34/100 · CRITICAL</div>
                                </div>
                            </div>

                            {/* Pseudo Commit Heatmap Strip */}
                            <div className="preview-heatmap-wrap">
                                <div className="preview-heatmap-label">
                                    Commit Log: 365 Days of Pain
                                </div>
                                <div className="preview-heatmap-grid" aria-hidden="true">
                                    {COMMIT_SAMPLE.map((color, index) => (
                                        <div
                                            key={index}
                                            className="heatmap-cell"
                                            style={{ background: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Punchy Example Roast Verdict */}
                            <div className="preview-quote-box">
                                <span className="preview-badge-verdict">AI Verdict</span>
                                <p className="preview-quote">
                                    &ldquo;47 abandoned repos, 0 unit tests, and commit messages that read like an escalating cry for help.&rdquo;
                                </p>
                            </div>

                            {/* Meta Badges Footer */}
                            <div className="preview-footer">
                                <span>ARCH: TUTORIAL_HOARDER</span>
                                <span>TECH: REGRET</span>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>
        </section>
    );
}
