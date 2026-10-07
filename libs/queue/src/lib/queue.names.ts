export const QUEUE_NAMES = {
  booking: 'mtw.booking',
  cancellation: 'mtw.cancellation',
  notification: 'mtw.notification',
  supplierSync: 'mtw.supplier-sync',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
