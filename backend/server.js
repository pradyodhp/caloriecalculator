const app = require('./src/app');
const config = require('./src/config/env');

app.listen(config.port, () => {
  console.log(`NutriTrack API listening on http://localhost:${config.port}`);
});
