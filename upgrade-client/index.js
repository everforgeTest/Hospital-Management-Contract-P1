const fs = require('fs');
const path = require('path');
const HotPocket = require('hotpocket-js-client');
const sodium = require('libsodium-wrappers');
const ContractService = require('./contract-service');

// Usage: node index.js <contractUrl> <zipFilePath> <version> <description>
const contractUrl = process.argv[2];
const zipPath = process.argv[3];
const versionStr = process.argv[4];
const description = process.argv[5] || '';

(async () => {
  if (!contractUrl || !zipPath || !versionStr) {
    console.log('Usage: node index.js <contractUrl> <zipFilePath> <version> <description>');
    process.exit(1);
  }

  const version = parseFloat(versionStr);
  if (Number.isNaN(version)) {
    console.error('Invalid version.');
    process.exit(1);
  }

  const fileName = path.basename(zipPath);
  const fileContent = fs.readFileSync(zipPath);
  const sizeKB = Math.round(fileContent.length / 1024);

  const userKeyPair = await HotPocket.generateKeys();
  const pubHex = Buffer.from(userKeyPair.publicKey).toString('hex');
  console.log('Maintainer pubkey (set this in contract .env MAINTAINER_PUBKEY):', pubHex);

  await sodium.ready;
  const sig = sodium.crypto_sign_detached(new Uint8Array(fileContent), new Uint8Array(userKeyPair.privateKey));
  const sigHex = Buffer.from(sig).toString('hex');

  const payload = {
    Service: 'Upgrade',
    Action: 'UpgradeContract',
    data: {
      version: version,
      description: description,
      zipBase64: fileContent.toString('base64'),
      sigHex: sigHex
    }
  };

  const svc = new ContractService([contractUrl], userKeyPair);
  const ok = await svc.init();
  if (!ok) {
    process.exit(1);
  }

  console.log(`Uploading ${fileName} (${sizeKB}KB) ...`);
  await svc.submitInput(payload);
  console.log('Upgrade submission sent.');
  process.exit(0);
})();
