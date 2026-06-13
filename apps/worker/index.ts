import { createServer } from 'node:http';
import { initConsumer } from './kafka/consumer.ts';
import { env } from './lib/env.ts';

// Start the Kafka Consumer logic
initConsumer().catch((err: unknown) => {
  console.error('Notification Service Worker failed to start:', err);
  process.exit(1);
});

// Simple Health Check (using node http)
const server = createServer((req, res) => {
  // index route
  if (req.url === '/' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'Welcome to the Worker service!',
      }),
    );
  }
  // health route
  if (req.url === '/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'ok',
        message: 'Worker Service is running',
        timestamp: new Date().toISOString(),
      }),
    );
  }
});

server.listen(env.WORKER_PORT, () => {
  console.log(
    `Worker service is running and listening for Kafka events... on http://localhost:${env.WORKER_PORT}`,
  );
});
