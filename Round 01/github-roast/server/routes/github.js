import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const GITHUB_API = 'https://api.github.com';
const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
    })
};

router.get('/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch user profile
        const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
        if (!userRes.ok) {
            if (userRes.status === 404) return res.status(404).json({ error: 'GitHub user not found' });
            return res.status(userRes.status).json({ error: 'GitHub API error' });
        }
        const user = await userRes.json();

        // Fetch repos (up to 100, sorted by updated)
        const reposRes = await fetch(
            `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=100`,
            { headers }
        );
        const repos = await reposRes.json();

        // Fetch README
        let readme = '';
        try {
            const readmeRes = await fetch(`${GITHUB_API}/repos/${username}/${username}/readme`, { headers });
            if (readmeRes.ok) {
                const readmeData = await readmeRes.json();
                readme = Buffer.from(readmeData.content, 'base64').toString('utf-8').slice(0, 2000);
            }
        } catch (_) { }

        // Analyze repos
        const languages = {};
        let totalStars = 0;
        let forkedCount = 0;
        const repoNames = [];

        for (const repo of repos) {
            if (repo.fork) forkedCount++;
            totalStars += repo.stargazers_count || 0;
            if (repo.language) languages[repo.language] = (languages[repo.language] || 0) + 1;
            repoNames.push(repo.name);
        }

        const topLangs = Object.entries(languages)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);

        const topRepos = repos
            .filter(r => !r.fork)
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 5)
            .map(r => ({ name: r.name, stars: r.stargazers_count, lang: r.language, description: r.description }));

        res.json({
            username,
            name: user.name || username,
            avatar: user.avatar_url,
            bio: user.bio || '',
            followers: user.followers,
            following: user.following,
            publicRepos: user.public_repos,
            totalStars,
            forkedCount,
            ownRepoCount: repos.length - forkedCount,
            topLanguages: topLangs,
            topRepos,
            repoNames: repoNames.slice(0, 20),
            accountAge: Math.floor((Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)),
            readme: readme.slice(0, 1500),
            location: user.location || '',
            company: user.company || '',
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
