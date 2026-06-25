import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { zentry } from './zentry';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello World!' });
});

// zentry endpoint
app.get('/zentry-user', zentry.requireUser(), (req: Request, res: Response) => {
  res.status(200).json({ message: 'Hello Zentry User!', user: req.zentry });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
