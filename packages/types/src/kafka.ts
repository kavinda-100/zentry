// ----------------------------- Kafka Event Types -------------------------------------------------

export type AuthEventType = 'EMAIL_VERIFICATION' | 'TWO_FACTOR_AUTH' | 'RESET_PASSWORD';

export type EmailVerificationPayload = {
  to: string;
  otp: string;
};

// Even if they look the same now, splitting them allows them to evolve separately
export type TwoFactorPayload = {
  to: string;
  otp: string;
};

export type ResetPasswordPayload = {
  to: string;
  otp: string;
};

export type AuthEventPayloadMap = {
  EMAIL_VERIFICATION: EmailVerificationPayload;
  TWO_FACTOR_AUTH: TwoFactorPayload;
  RESET_PASSWORD: ResetPasswordPayload;
};

// generic interface for all kafka events
export interface KafkaEventPayloadType<T, K> {
  eventId: string;
  type: T;
  timestamp: string;
  payload: K;
}

// ----------------------------- Kafka Event Types End-------------------------------------------------
