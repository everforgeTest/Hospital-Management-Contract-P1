const { ServiceTypes } = require('./Constants/ServiceTypes');
const { PatientController } = require('./Controllers/Patient.Controller');
const { DoctorController } = require('./Controllers/Doctor.Controller');
const { AppointmentController } = require('./Controllers/Appointment.Controller');
const { UpgradeController } = require('./Controllers/Upgrade.Controller');

class Controller {
  constructor() {}

  async handleRequest(user, message, isReadOnly) {
    const service = message.Service || message.service;
    let result = {};

    try {
      switch (service) {
        case ServiceTypes.UPGRADE: {
          const uc = new UpgradeController(message, this._extractUserPubHex(user));
          result = await uc.handleRequest();
          break;
        }
        case ServiceTypes.PATIENT: {
          const pc = new PatientController(message);
          result = await pc.handleRequest();
          break;
        }
        case ServiceTypes.DOCTOR: {
          const dc = new DoctorController(message);
          result = await dc.handleRequest();
          break;
        }
        case ServiceTypes.APPOINTMENT: {
          const ac = new AppointmentController(message);
          result = await ac.handleRequest();
          break;
        }
        default:
          result = { error: { message: 'Invalid service.' } };
      }
    } catch (e) {
      result = { error: { message: e && e.message ? e.message : 'Unhandled error.' } };
    }

    await this.sendOutput(user, result);
  }

  async sendOutput(user, response) {
    try {
      await user.send(response);
    } catch (e) {
      console.error('Failed sending response:', e);
    }
  }

  _extractUserPubHex(user) {
    try {
      if (!user) return '';
      if (user.publicKey) {
        if (Buffer.isBuffer(user.publicKey)) return user.publicKey.toString('hex');
        if (typeof user.publicKey === 'string') return user.publicKey;
      }
    } catch (e) {}
    return '';
  }
}

module.exports = { Controller };
