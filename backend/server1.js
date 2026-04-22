const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require('path');
const fs = require('fs');

// Load environment variables
// Try multiple .env locations
const envPaths = [
  path.join(__dirname, '.env'),           // Same directory as server.js
  path.join(process.cwd(), '.env'),       // Current working directory
  path.join(__dirname, '..', '.env')      // Parent directory
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ LOADED .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('❌ No .env file found in any location!');
}

const nutritionRoutes = require('./src/routes/nutritionRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors()); // Configure CORS as needed for production

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use(limiter);

app.use(express.json());

// Routes
app.use('/nutrition', nutritionRoutes);

// Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🏥 Medical Nutrition API running on http://localhost:${PORT}`);
  console.log(`🎯 Designed for diabetes prevention in Indian population`);
  console.log(`🔒 Security headers and rate limiting enabled`);
});
