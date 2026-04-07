const fs = require('fs');
const { SharedService } = require('./SharedService');
const { Tables } = require('../../Constants/Tables');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('./dbHandler');

class UpgradeService {
  constructor(message) {
    this.message = message || {};
    this.dbPath = settings.dbPath;
    this.dbContext = new SqliteDatabase(this.dbPath);
    return SharedService.getUtcISOStringFromUnixTimestamp(SharedService.context.timestamp);
  }

  async upgradeContract({ zipBuffer, version, description }) {
    const resObj = {};
    try {
      this.dbContext.open();
      const last = await this.dbContext.getLastRecord(Tables.ContractVersion);
      const currentVersion = last && last.Version ? last.Version : 1.0;

      if (!(version > currentVersion)) {
        return { error: { code: 403, message: 'Incoming version must be greater than current version.' } };
      }

      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const shellScriptContent = `#!/bin/bash\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
zip_file=\"${settings.newContractZipFileName}\"\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
rm \"$zip_file\" >>/dev/null\
`;
      fs.writeFileSync(settings.postExecutionScriptName, shellScriptContent);
      fs.chmodSync(settings.postExecutionScriptName, 0o777);

      const row = {
        Description: description,
        LastUpdatedOn: SharedService.context.timestamp,
        Version: version,
        CreatedOn: SharedService.context.timestamp
      };
      const r = await this.dbContext.insertValue(Tables.ContractVersion, row);
      resObj.success = { message: 'Contract upgraded', id: r.lastId, version };
    } catch (e) {
      return { error: { code: 500, message: e && e.message ? e.message : 'Failed to upgrade contract.' } };
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }
}

module.exports = { UpgradeService };
