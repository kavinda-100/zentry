import { Kafka, Partitioners } from 'kafkajs';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { env } from './env';
import type {
  AuthEventPayloadMap,
  AuthEventType,
  KafkaEventPayloadType,
} from '@zentry/types/src/kafka';

// Kafka topic names
const API_AUTH_EVENTS_TOPIC = 'api-auth-events';

export const kafka = new Kafka({
  clientId: 'api-auth-service',
  brokers: env.KAFKA_BROKERS,
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

/**
 * @description This function is used to publish an authentication event to the Kafka topic.
 * @param {AuthEventType} type - The type of the authentication event.
 * @param userId - The ID of the user associated with the event.
 * @param payload - The payload of the authentication event.
 * @returns {Promise<void>} A promise that resolves when the event is published successfully.
 */
export async function publishAuthEvent<T extends AuthEventType>({
  type,
  userId,
  payload,
}: {
  type: T;
  userId: string;
  payload: AuthEventPayloadMap[T];
}): Promise<void> {
  try {
    // connect to the Kafka broker
    await producer.connect();

    // construct the event payload
    const eventPayload: KafkaEventPayloadType<T, AuthEventPayloadMap[T]> = {
      eventId: `evt_${randomUUID()}`,
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    // publish the event to the Kafka topic
    await producer.send({
      topic: API_AUTH_EVENTS_TOPIC,
      messages: [
        {
          key: userId,
          value: JSON.stringify(eventPayload),
        },
      ],
    });
    logger.info(`Auth event published: on ${type}`);
  } catch (e) {
    logger.error({ e }, `Error publishing auth event: on ${type}`);
  }
}
