const { Tables } = require('../../Constants/Tables');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const { SharedService } = require('../Common.Services/SharedService');

class PatientService {
  constructor(message) {
    this.message = message || {};
    this.dbPath = settings.dbPath;
    this.dbContext = new SqliteDatabase(this.dbPath);
    //abc
  }

  async create() {
    const resObj = {};
    try {
      this.dbContext.open();
      const d = this.message.data || {};
      const row = {
        Name: d.Name,
        DOB: d.DOB || null,
        Gender: d.Gender || null,
        Contact: d.Contact || null,
        ConcurrencyKey: SharedService.generateConcurrencyKey()
      };
      const r = await this.dbContext.insertValue(Tables.Patients, row);
      resObj.success = { id: r.lastId };
    } catch (e) {
      throw e;
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }

  async getById() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const rows = await this.dbContext.getValues(Tables.Patients, { Id: id });
      if (!rows.length) return { error: { message: 'Not found' } };
      resObj.success = rows[0];
    } catch (e) {
      throw e;
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }

  async list() {
    const resObj = {};
    try {
      this.dbContext.open();
      const rows = await this.dbContext.getValues(Tables.Patients, {});
      resObj.success = rows;
    } catch (e) {
      throw e;
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }

  async update() {
    const resObj = {};
    try {
      this.dbContext.open();
      const d = this.message.data || {};
      const id = d.Id;
      const updates = {};
      if (d.Name !== undefined) updates.Name = d.Name;
      if (d.DOB !== undefined) updates.DOB = d.DOB;
      if (d.Gender !== undefined) updates.Gender = d.Gender;
      if (d.Contact !== undefined) updates.Contact = d.Contact;
      updates.LastUpdatedOn = new Date().toISOString();
      updates.ConcurrencyKey = SharedService.generateConcurrencyKey();
      const r = await this.dbContext.updateValue(Tables.Patients, updates, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) {
      throw e;
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }

  async delete() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const r = await this.dbContext.deleteValues(Tables.Patients, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) {
      throw e;
    } finally {
      this.dbContext.close();
    }
    return resObj;
  }
}

module.exports = { PatientService };
