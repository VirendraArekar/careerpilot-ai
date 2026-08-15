import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function start() {
  await connectDatabase();
  app.listen(env.PORT, () =>
    console.info(`CareerPilot API listening on http://localhost:${env.PORT}`)
  );
}

start().catch((error) => {
  console.error('Startup failed', error);
  process.exit(1);
});
