const { Kafka, logLevel } = require('kafkajs');
const { KAFKA_BROKERS, KAFKA_CLIENT_ID } = require('../../config');

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.NOTHING,
  retry: { retries: 8 },
});

const producer = kafka.producer();
let connected = false;

async function connectProducer() {
  if (!connected) {
    await producer.connect();
    connected = true;
    console.log('[kafka] producer connected');
  }
  return producer;
}

async function publish(topic, message) {
  try {
    await connectProducer();
    await producer.send({
      topic,
      messages: [{ key: String(message.key || ''), value: JSON.stringify(message) }],
    });
    console.log(`[kafka] published ${message.event} -> ${topic}`);
  } catch (err) {
    console.error(`[kafka] failed to publish ${message.event}:`, err.message);
  }
}

module.exports = { connectProducer, publish };
