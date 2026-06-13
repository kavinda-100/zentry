import type {
  AuthEventType,
  AuthEventPayloadMap,
  KafkaEventPayloadType,
} from '@zentry/types/src/kafka';
import {
  sendResetPasswordEmail,
  sendTwoFactorAuthEmail,
  sendVerificationEmail,
} from '../lib/mailer.ts';

/**
 * Logic for Auth-related notifications
 */
export async function handleAuthEvents(
  event: KafkaEventPayloadType<AuthEventType, AuthEventPayloadMap[AuthEventType]>,
) {
  if (event.type === 'EMAIL_VERIFICATION') {
    try {
      // In Identity Service: ---------
      // const payload = {
      // 	eventId: uuid(),
      // 	type: 'EMAIL_VERIFICATION',
      // 	timestamp: new Date().toISOString(),
      // 	payload: {
      // 		to: user.email,
      // 		otp: '123456',
      // 	},
      // };
      console.log(`Sending ${event.type} to ${event.payload.to}`);
      await sendVerificationEmail({
        to: event.payload.to,
        otp: event.payload.otp,
      });
      console.log(`Send ${event.type} to ${event.payload.to} successfully`);
    } catch (error) {
      console.error(`Failed to send ${event.type} email:`, error);
    }
  }
  if (event.type === 'TWO_FACTOR_AUTH') {
    try {
      // In Identity Service: ---------
      // const payload = {
      // 	eventId: uuid(),
      // 	type: 'TWO_FACTOR_AUTH',
      // 	timestamp: new Date().toISOString(),
      // 	payload: {
      // 		to: user.email,
      // 		otp: '123456',
      // 	},
      // };
      console.log(`Sending ${event.type} to ${event.payload.to}`);
      await sendTwoFactorAuthEmail({
        to: event.payload.to,
        otp: event.payload.otp,
      });
    } catch (error) {
      console.error(`Failed to send ${event.type} email:`, error);
    }
  }
  if (event.type === 'RESET_PASSWORD') {
    try {
      // In Identity Service: ---------
      // const payload = {
      // 	eventId: uuid(),
      // 	type: 'RESET_PASSWORD',
      // 	timestamp: new Date().toISOString(),
      // 	payload: {
      // 		to: user.email,
      // 		otp: '123456',
      // 	},
      // };
      console.log(`Sending ${event.type} to ${event.payload.to}`);
      await sendResetPasswordEmail({
        to: event.payload.to,
        otp: event.payload.otp,
      });
    } catch (error) {
      console.error(`Failed to send ${event.type} email:`, error);
    }
  }
}
