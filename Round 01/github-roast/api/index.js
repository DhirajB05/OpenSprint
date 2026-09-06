// Vercel Serverless Function — wraps the Express app
import express from 'express';
import cors from 'cors';
import githubRouter from '../server/routes/github.js';
import roastRouter from '../server/routes/roast.js';
import memeRouter from '../server/routes/meme.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/github', githubRouter);
app.use('/api/roast', roastRouter);
app.use('/api/meme', memeRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

export default app;
