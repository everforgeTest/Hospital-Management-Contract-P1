const HotPocket = require('hotpocket-nodejs-contract');
const bson = require('bson');
const { Controller } = require('./controller');
const { SharedService } = require('./Services/Common.Services/SharedService');
const { DBInitializer } = require('./Data.Deploy/initDB');
const { Tables } = require('./Constants/Tables');
const settings = require('./settings.json').settings;
const { SqliteDatabase } = require('./Services/Common.Services/dbHandler');

const hospitalContract = async (ctx) => {
  console.log('Hospital contract is running.');

  SharedService.context = ctx;
  const isReadOnly = ctx.readonly;

  if (!isReadOnly) {
    ctx.unl.onMessage((node, msg) => {
      try {
        const obj = JSON.parse(msg.toString());
        if (obj.type) SharedService.nplEventEmitter.emit(obj.type, node, msg);
      } catch (e) {
        console.error('Invalid NPL message', e);
      }
    });
  }

  try {
    await DBInitializer.init();
  } catch (e) {
    console.error('DB init error:', e);
  }

  // Print current version
  const dbPath = settings.dbPath;
  const dbContext = new SqliteDatabase(dbPath);
  try {
    dbContext.open();
    const row = await dbContext.getLastRecord(Tables.ContractVersion) || { Version: 1.0 };
    console.log('Current contract version:', row.Version);
  } catch (e) {
    console.log('Error while getting contract version', e);
  } finally {
    dbContext.close();
  }

  const controller = new Controller();

  for (const user of ctx.users.list()) {
    for (const input of user.inputs) {
      const buf = await ctx.users.read(input);
      let message = null;
      try {
        message = JSON.parse(buf.toString());
      } catch (e) {
        try {
          message = bson.deserialize(buf);
        } catch (e2) {
          console.error('Invalid input format.');
          continue;
        }
      }
      if (message && message.Data && !message.data) message.data = message.Data;
      await controller.handleRequest(user, message, isReadOnly);
    }
  }
};

const hpc = new HotPocket.Contract();
hpc.init(hospitalContract, HotPocket.clientProtocols.JSON, true);
