const { Tables } = require('../../Constants/Tables');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const { SharedService } = require('../Common.Services/SharedService');

class DoctorService {
  constructor(message) {
    this.message = message || {};
    this.dbPath = settings.dbPath;
    this.dbContext = new SqliteDatabase(this.dbPath);
  }

  async create() {
    const resObj = {};
    try {
      this.dbContext.open();
      const d = this.message.data || {};
      const row = {
        Name: d.Name,
        Specialty: d.Specialty || null,
        Contact: d.Contact || null,
        ConcurrencyKey: SharedService.generateConcurrencyKey()
      };
      const r = await this.dbContext.insertValue(Tables.Doctors, row);
      resObj.success = { id: r.lastId };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async getById() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const rows = await this.dbContext.getValues(Tables.Doctors, { Id: id });
      if (!rows.length) return { error: { message: 'Not found' } };
      resObj.success = rows[0];
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async list() {
    const resObj = {};
    try {
      this.dbContext.open();
      const rows = await this.dbContext.getValues(Tables.Doctors, {});
      resObj.success = rows;
    } catch (e) { throw e; } finally { this.dbContext.close(); }
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
      if (d.Specialty !== undefined) updates.Specialty = d.Specialty;
      if (d.Contact !== undefined) updates.Contact = d.Contact;
      updates.LastUpdatedOn = new Date().toISOString();
      updates.ConcurrencyKey = SharedService.generateConcurrencyKey();
      const r = await this.dbContext.updateValue(Tables.Doctors, updates, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async delete() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const r = await this.dbContext.deleteValues(Tables.Doctors, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }
}

module.exports = { DoctorService };
