const express = require('express');

const { PORT } = require('./config');
const { startConsumer, stopConsumer } = require('./utils/kafka/consumer');

const app = express();
app.get('/health', (req, res) => res.json({ service: 'notification-service', status: 'ok' }));

async function start() {
  app.listen(PORT, () => console.log(`[notification] service started on port ${PORT}`));

  try {
    await startConsumer();
  } catch (err) {
    console.error('[notification] consumer failed to start:', err.message);
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, async () => {
    await stopConsumer().catch(() => {});
    process.exit(0);
  })
);

start();
