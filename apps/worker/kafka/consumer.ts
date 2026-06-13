import { Kafka } from 'kafkajs';
import { handleAuthEvents } from '../events/auth-events.ts';
import { env } from '../lib/env.ts';

// Example Kafka message structure for an email verification event
// {
//     "eventId": "evt_01j7p3...",
//     "type": "EMAIL_VERIFICATION",
//     "timestamp": "2026-05-07T13:30:00Z",
//     "payload": {
//       "userId": "user_2a8h1...",
//       "email": "user@example.com",
//       "otp": "482910"
//     }
// }

// Kafka topic names
const API_AUTH_EVENTS_TOPIC = 'api-auth-events';

// Initialize Kafka client and consumer
const kafka = new Kafka({
  clientId: 'worker-service',
  brokers: env.KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000, // Wait 1s before first retry
    retries: 10, // Try 10 times before crashing
    maxRetryTime: 30000,
    factor: 2, // Exponential backoff
  },
});

const admin = kafka.admin();

// Create a consumer instance with a specific group ID
const consumer = kafka.consumer({ groupId: 'worker-group' });

async function ensureTopicsExist() {
  await admin.connect();

  try {
    await admin.createTopics({
      waitForLeaders: true,
      topics: [
        {
          topic: API_AUTH_EVENTS_TOPIC,
          numPartitions: env.KAFKA_NUM_PARTITIONS,
          replicationFactor: env.KAFKA_REPLICATION_FACTOR,
        },
      ],
    });
  } finally {
    await admin.disconnect();
  }
}

// Main function to initialize the Kafka consumer and start listening for messages
export async function initConsumer() {
  await ensureTopicsExist();
  await consumer.connect();

  // Subscribe to multiple topics
  await consumer.subscribe({ topic: API_AUTH_EVENTS_TOPIC, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        console.error(`Received empty message on topic ${topic}`);
        return;
      }

      try {
        const event = JSON.parse(message.value.toString());
        console.log(`[${topic}] Received:`, event.type);

        switch (topic) {
          case API_AUTH_EVENTS_TOPIC:
            await handleAuthEvents(event);
            break;
          default:
            console.warn(`No handler for topic: ${topic}`);
        }
      } catch (error) {
        console.error(`Error processing message on ${topic}:`, error);
      }
    },
  });
}
