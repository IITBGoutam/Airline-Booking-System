const express = require('express');
const morgan = require('morgan');

const { PORT } = require('./config');
const apiRoutes = require('./routes');
const db = require('./models');
const { connectProducer } = require('./utils/kafka/producer');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ service: 'booking-service', status: 'ok' }));
app.use('/api', apiRoutes);

async function start() {
  try {
    await db.sequelize.authenticate();
    console.log('[booking] database connection established');
  } catch (err) {
    console.error('[booking] database connection failed:', err.message);
  }

  // Warm up the producer but do not block startup if Kafka is slow to come up.
  connectProducer().catch((err) =>
    console.error('[booking] kafka producer connect failed (will retry on publish):', err.message)
  );

  app.listen(PORT, () => console.log(`[booking] service started on port ${PORT}`));
}

start();
