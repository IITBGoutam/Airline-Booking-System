const express = require('express');
const morgan = require('morgan');

const { PORT } = require('./config');
const apiRoutes = require('./routes');
const db = require('./models');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ service: 'auth-service', status: 'ok' }));
app.use('/api', apiRoutes);

async function start() {
  try {
    await db.sequelize.authenticate();
    console.log('[auth] database connection established');
  } catch (err) {
    console.error('[auth] database connection failed:', err.message);
  }
  app.listen(PORT, () => console.log(`[auth] service started on port ${PORT}`));
}

start();
