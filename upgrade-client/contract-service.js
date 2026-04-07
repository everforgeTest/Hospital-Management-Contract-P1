const HotPocket = require('hotpocket-js-client');

class ContractService {
  constructor(servers, userKeyPair) {
    this.servers = servers;
    this.userKeyPair = userKeyPair;
    this.client = null;
    this.connected = false;
  }

  async init() {
    if (!this.userKeyPair) this.userKeyPair = await HotPocket.generateKeys();
    this.client = await HotPocket.createClient(this.servers, this.userKeyPair);

    this.client.on(HotPocket.events.disconnect, () => {
      console.log('Disconnected');
      this.connected = false;
    });

    this.client.on(HotPocket.events.connectionChange, (server, action) => {
      console.log(server + ' ' + action);
    });

    if (!(await this.client.connect())) {
      console.log('Connection failed.');
      return false;
    }
    console.log('HotPocket Connected.');
    this.connected = true;
    return true;
  }

  async submitInput(payload) {
    const buf = Buffer.from(JSON.stringify(payload));
    await this.client.submitContractInput(buf);
  }
}

module.exports = ContractService;
