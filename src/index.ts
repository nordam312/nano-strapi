/**
 * Temporary playground to test each stage as we build it.
 * (Later this becomes the real framework entry point.)
 */
import { Container } from './core/container.js';

console.log('=== Stage 1: DI Container demo ===\n');

const container = new Container();

// Register two services. Note the log lines INSIDE the factories —
// they prove the factory does NOT run at registration time.
container
  .register('config', () => {
    console.log('  [factory ran] building "config"');
    return { port: 1337, appName: 'nano-strapi' };
  })
  .register('logger', (c) => {
    console.log('  [factory ran] building "logger"');
    // A service looking up ANOTHER service via the container:
    const config = c.get<{ appName: string }>('config');
    return {
      info: (msg: string) => console.log(`  [${config.appName}] ${msg}`),
    };
  });

console.log('1) Registered "config" and "logger". Notice: no factory ran yet.\n');

console.log('2) Now calling get("logger") for the first time:');
const logger = container.get<{ info: (m: string) => void }>('logger');
console.log('   -> logger built. It pulled "config" itself via the container.\n');

console.log('3) Using the logger:');
logger.info('Hello from a lazily-built service!');

console.log('\n4) Calling get("logger") again — factory should NOT run (cached):');
const logger2 = container.get('logger');
console.log('   -> same instance?', logger === logger2);
