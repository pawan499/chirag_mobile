// Isolated manual smoke-test server. Uses the actual backend with an ephemeral DB.
// Never reads the production .env and never connects to the production database.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url))); 
const requireBackend = createRequire(new URL('../../chirag eyecare/package.json', import.meta.url));
const {MongoMemoryServer} = requireBackend('mongodb-memory-server');
const mongoose = requireBackend('mongoose');
const bcrypt = requireBackend('bcryptjs');
const mongo = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = mongo.getUri();
process.env.JWT_SECRET = 'isolated-mobile-smoke-test-secret-123456';
process.env.ENABLE_SWAGGER = 'false';
await mongoose.connect(mongo.getUri());
const {default: User} = await import('../../chirag eyecare/src/models/User.js');
await User.create({name: 'Dr. Chirag', email: 'mobile@test.local', passwordHash: await bcrypt.hash('mobile-test-123', 10)});
const {default: app} = await import('../../chirag eyecare/src/app.js');
const server = app.listen(4100, '127.0.0.1', () => console.log('Isolated test API: http://127.0.0.1:4100/api/v1 (mobile@test.local / mobile-test-123)'));
async function shutdown() {server.close(); await mongoose.disconnect(); await mongo.stop(); process.exit(0);}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
