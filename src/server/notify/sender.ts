export interface OutgoingMessage {
  to: string;
  body: string;
}

// WhatsApp or SMS providers plug in here later. v0.1 only simulates delivery.
export interface NotificationSender {
  channel: "SIMULATED" | "WHATSAPP" | "SMS";
  send(message: OutgoingMessage): Promise<void>;
}

export const simulatedSender: NotificationSender = {
  channel: "SIMULATED",
  async send({ to, body }) {
    console.log(`[outbox] ${to} ${body}`);
  },
};
