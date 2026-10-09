const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const nutritionRoutes = require('./routes/nutritionRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/nutrition', nutritionRoutes);
app.use(errorHandler);

module.exports = app;
