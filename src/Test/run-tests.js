const { createClient } = require('./test-utils');
const HospitalTest = require('./TestCases/HospitalTest');

(async () => {
  try {
    const client = await createClient(['wss://localhost:8081']);
    await HospitalTest(client);
    console.log('All tests passed.');
    process.exit(0);
  } catch (e) {
    console.error('Tests failed:', e);
    process.exit(1);
  }
})();
