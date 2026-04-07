const { Tables } = require('../../Constants/Tables');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('../Common.Services/dbHandler');
const { SharedService } = require('../Common.Services/SharedService');

class AppointmentService {
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
      if (!d.PatientId || !d.DoctorId || !d.DateTime) {
        return { error: { message: 'PatientId, DoctorId and DateTime are required.' } };
      }
      const p = await this.dbContext.getValues(Tables.Patients, { Id: d.PatientId });
      const doc = await this.dbContext.getValues(Tables.Doctors, { Id: d.DoctorId });
      if (!p.length || !doc.length) return { error: { message: 'Invalid PatientId/DoctorId' } };

      const row = {
        PatientId: d.PatientId,
        DoctorId: d.DoctorId,
        DateTime: d.DateTime,
        Reason: d.Reason || null,
        Status: d.Status || 'Scheduled',
        ConcurrencyKey: SharedService.generateConcurrencyKey()
      };
      const r = await this.dbContext.insertValue(Tables.Appointments, row);
      resObj.success = { id: r.lastId };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async getById() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const rows = await this.dbContext.getValues(Tables.Appointments, { Id: id });
      if (!rows.length) return { error: { message: 'Not found' } };
      resObj.success = rows[0];
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async list() {
    const resObj = {};
    try {
      this.dbContext.open();
      const rows = await this.dbContext.getValues(Tables.Appointments, {});
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
      if (d.PatientId !== undefined) updates.PatientId = d.PatientId;
      if (d.DoctorId !== undefined) updates.DoctorId = d.DoctorId;
      if (d.DateTime !== undefined) updates.DateTime = d.DateTime;
      if (d.Reason !== undefined) updates.Reason = d.Reason;
      if (d.Status !== undefined) updates.Status = d.Status;
      updates.LastUpdatedOn = new Date().toISOString();
      updates.ConcurrencyKey = SharedService.generateConcurrencyKey();
      const r = await this.dbContext.updateValue(Tables.Appointments, updates, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }

  async delete() {
    const resObj = {};
    try {
      this.dbContext.open();
      const id = this.message.data && this.message.data.Id;
      const r = await this.dbContext.deleteValues(Tables.Appointments, { Id: id });
      resObj.success = { changes: r.changes };
    } catch (e) { throw e; } finally { this.dbContext.close(); }
    return resObj;
  }
}

module.exports = { AppointmentService };
