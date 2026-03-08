import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:3001';

const STEPS = [
    { msg: '> Cloning your GitHub soul...', type: 'done', delay: 400 },
    { msg: '> Scanning README.md for delusion levels...', type: 'warn', delay: 900 },
    { msg: '> Counting abandoned side projects...', type: 'done', delay: 1500 },
    { msg: '> Analyzing commit messages for existential dread...', type: 'done', delay: 2000 },
    { msg: '> Detecting tutorial-starter repos...', type: 'warn', delay: 2500 },
    { msg: '> Calculating years of experience claimed vs repos showing...', type: 'done', delay: 3000 },
    { msg: '> Measuring ratio of stars to actual code quality...', type: 'error', delay: 3500 },
    { msg: '> Running sarcasm.js...', type: 'done', delay: 4000 },
    { msg: '> Generating roast with maximum savagery...', type: 'warn', delay: 4500 },
];

const TIPS = [
    '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." — Martin Fowler (your code disproves this)',
    '"First, solve the problem. Then, write the code." — Then git push --force.',
    '"It\'s not a bug — it\'s an undocumented feature." — Every GitHub README ever.',
    '"Code never lies, comments sometimes do." — Neither do your 37 "fix" commits.',
    '"The best code is no code at all." — Your repos are FULL of best code.',
];

export default function Loading() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [lines, setLines] = useState([]);
    const [progress, setProgress] = useState(0);
    const [statusMsg, setStatusMsg] = useState('Initializing...');
    const hasFetched = useRef(false);

    const { username, mode } = state || {};
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

    useEffect(() => {
        if (!username) { navigate('/'); return; }
        if (hasFetched.current) return;
        hasFetched.current = true;

        // Animate console lines
        STEPS.forEach((step, i) => {
            setTimeout(() => {
                setLines(prev => [...prev, step]);
                setProgress(Math.round(((i + 1) / STEPS.length) * 80));
            }, step.delay);
        });

        // Fetch data
        const doFetch = async () => {
            try {
                setStatusMsg('Fetching GitHub data...');
                const ghRes = await axios.get(`${API}/api/github/${username}`);
                const githubData = ghRes.data;

                setStatusMsg('Generating roast with AI...');
                setProgress(85);
                const roastRes = await axios.post(`${API}/api/roast`, { githubData, mode });

                setProgress(100);
                setStatusMsg('Roast ready! 🔥');

                setTimeout(() => {
                    navigate('/results', { state: { githubData, roastData: roastRes.data, mode } });
                }, 600);

            } catch (err) {
                const msg = err.response?.data?.error || err.message || 'Something went wrong';
                navigate('/results', {
                    state: {
                        error: msg,
                        username,
                    }
                });
            }
        };

        setTimeout(doFetch, 1200);
    }, [username, mode, navigate]);

    return (
        <div className="loading">
            <div className="loading-card">
                <div className="loading-header">
                    <div className="terminal-dots">
                        <div className="dot dot-r" />
                        <div className="dot dot-y" />
                        <div className="dot dot-g" />
                    </div>
                    <span className="terminal-title">roast.sh — analyzing @{username}</span>
                </div>

                <div className="console-lines">
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            className={`console-line ${line.type}`}
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {line.type === 'done' && '✓ '}{line.type === 'error' && '✗ '}{line.type === 'warn' && '⚠ '}
                            {line.msg}
                        </div>
                    ))}
                    <span className="cursor">█</span>
                </div>

                <div className="loading-progress">
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-label">
                        <span>{statusMsg}</span>
                        <span>{progress}%</span>
                    </div>
                </div>

                <div className="loading-tip">💡 {tip}</div>
            </div>
        </div>
    );
}
