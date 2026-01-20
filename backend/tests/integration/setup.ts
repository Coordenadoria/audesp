// tests/integration/setup.ts
import { beforeAll, afterAll } from 'vitest';
import app from '../../src/app';

let server: any;

beforeAll(async () => {
  // Start the test server
  server = app.listen(3001, () => {
    console.log('Test server running on port 3001');
  });
});

afterAll(async () => {
  // Clean up: close the server and clear data
  if (server) {
    server.close();
  }
});
