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

app.get('/health', (req, res) => res.json({ service: 'flight-service', status: 'ok' }));
app.use('/api', apiRoutes);

async function start() {
  try {
    await db.sequelize.authenticate();
    console.log('[flight] database connection established');
  } catch (err) {
    console.error('[flight] database connection failed:', err.message);
  }

  connectProducer().catch((err) =>
    console.error('[flight] kafka producer connect failed (will retry on publish):', err.message)
  );

  app.listen(PORT, () => console.log(`[flight] service started on port ${PORT}`));
}

start();
