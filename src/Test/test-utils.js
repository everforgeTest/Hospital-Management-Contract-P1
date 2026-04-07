const HotPocket = require('hotpocket-js-client');

async function createClient(urls) {
  const keyPair = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(urls, keyPair);
  const connected = await client.connect();
  if (!connected) throw new Error('Client connection failed');
  return client;
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`Assertion failed: ${msg} (${a} !== ${b})`);
}

function assertSuccessResponse(resp, msg) {
  if (!resp || !resp.success) throw new Error(`Expected success response: ${msg}`);
}

function assertErrorResponse(resp, msg) {
  if (!resp || !resp.error) throw new Error(`Expected error response: ${msg}`);
}

module.exports = { createClient, assertEqual, assertSuccessResponse, assertErrorResponse };
