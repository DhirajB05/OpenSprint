import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import githubRouter from './routes/github.js';
import roastRouter from './routes/roast.js';
import memeRouter from './routes/meme.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true })); // Dev: allow all origins
app.use(express.json());

app.use('/api/github', githubRouter);
app.use('/api/roast', roastRouter);
app.use('/api/meme', memeRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🔥 GitHub Roast server running on port ${PORT}`);
});
