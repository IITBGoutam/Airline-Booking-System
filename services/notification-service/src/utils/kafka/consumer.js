const { Kafka, logLevel } = require('kafkajs');
const {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_GROUP_ID,
  BOOKING_TOPIC,
  AVAILABILITY_TOPIC,
} = require('../../config');

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.NOTHING,
  retry: { retries: 20, initialRetryTime: 2000 },
});

const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

// Mock notification transport. In a real system this would call an email/SMS
// provider; here we log so the async flow is observable end to end.
function sendNotification(kind, payload) {
  console.log(`[notify] (${kind}) ->`, JSON.stringify(payload));
}

function handleBookingEvent(event) {
  switch (event.event) {
    case 'BOOKING_CREATED':
      sendNotification('email', {
        to: `user-${event.data.userId}`,
        subject: 'Your booking is confirmed',
        body: `Booking #${event.data.bookingId} for flight ${event.data.flightId} (${event.data.noOfSeats} seat(s)) is confirmed. Total: ${event.data.totalCost}.`,
      });
      break;
    case 'BOOKING_CANCELLED':
      sendNotification('email', {
        to: `user-${event.data.userId}`,
        subject: 'Your booking was cancelled',
        body: `Booking #${event.data.bookingId} for flight ${event.data.flightId} has been cancelled.`,
      });
      break;
    default:
      console.log('[notify] unhandled booking event:', event.event);
  }
}

function handleAvailabilityEvent(event) {
  // Real-time availability update -> could push to a websocket / cache.
  sendNotification('availability', {
    flightId: event.data.flightId,
    remainingSeats: event.data.remainingSeats,
  });
}

async function startConsumer() {
  await consumer.connect();
  console.log('[kafka] consumer connected');
  await consumer.subscribe({ topic: BOOKING_TOPIC, fromBeginning: false });
  await consumer.subscribe({ topic: AVAILABILITY_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        if (topic === BOOKING_TOPIC) handleBookingEvent(event);
        else if (topic === AVAILABILITY_TOPIC) handleAvailabilityEvent(event);
      } catch (err) {
        console.error('[notify] failed to process message:', err.message);
      }
    },
  });
}

async function stopConsumer() {
  await consumer.disconnect();
}

module.exports = { startConsumer, stopConsumer };
