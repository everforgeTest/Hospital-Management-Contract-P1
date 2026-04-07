const nacl = require('tweetnacl');
const { UpgradeService } = require('../Services/Common.Services/Upgrade.Service');

class UpgradeController {
  constructor(message, userPubKeyHex) {
    this.message = message || {};
    this.userPubKeyHex = (userPubKeyHex || '').toLowerCase();
    this.service = new UpgradeService(this.message);
    //abc
  }

  async handleRequest() {
    try {
      if (this.message.Action !== 'UpgradeContract') {
        return { error: { message: 'Invalid action.' } };
      }

      // Handshake authorization
      const expected = (process.env.MAINTAINER_PUBKEY || '').toLowerCase();
      if (!expected || this.userPubKeyHex !== expected) {
        return { error: { code: 401, message: 'Unauthorized' } };
      }

      // Content signature verification (Ed25519 detached)
      const data = this.message.data || {};
      const zipBase64 = data.zipBase64;
      const sigHex = data.sigHex;
      const version = data.version;
      const description = data.description || '';

      if (!zipBase64 || !sigHex || typeof version !== 'number') {
        return { error: { code: 400, message: 'Invalid upgrade payload.' } };
      }

      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const signature = Buffer.from(sigHex, 'hex');
      const pubkey = Buffer.from(this.userPubKeyHex, 'hex');

      const verified = nacl.sign.detached.verify(new Uint8Array(zipBuffer), new Uint8Array(signature), new Uint8Array(pubkey));
      if (!verified) {
        return { error: { code: 401, message: 'Signature verification failed.' } };
      }

      // Delegate to service
      return await this.service.upgradeContract({ zipBuffer, version, description });
    } catch (e) {
      return { error: { code: 500, message: e && e.message ? e.message : 'Upgrade failed.' } };
    }
  }
}

module.exports = { UpgradeController };
