import { createApp } from './src/app.js';
import { loadConfig } from './src/config/env.js';
import { FoodSearchService } from './src/modules/food/searchService.js';
import { UsdaProvider } from './src/modules/food/providers/usda.js';
import { logger } from './src/shared/logger.js';

const config = loadConfig();
const app = createApp(config, { foodSearch: new FoodSearchService([new UsdaProvider(config.usdaApiKey)]) });
app.listen(config.port, () => logger.info('server_started', { port: config.port }));
