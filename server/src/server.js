import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { validateJwtConfiguration } from './utils/jwt.js';

const port = Number.parseInt(process.env.PORT || '5000', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}

try {
  validateJwtConfiguration();
  await connectDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.info(`CareerLens AI server listening on 0.0.0.0:${port}.`);
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}