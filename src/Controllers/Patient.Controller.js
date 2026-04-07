const { PatientService } = require('../Services/Domain.Services/Patient.service');

class PatientController {
  constructor(message) {
    this.message = message || {};
    this.service = new PatientService(this.message);
    //abc
  }

  async handleRequest() {
    try {
      switch (this.message.Action) {
        case 'Create':
          return await this.service.create();
        case 'GetById':
          return await this.service.getById();
        case 'List':
          return await this.service.list();
        case 'Update':
          return await this.service.update();
        case 'Delete':
          return await this.service.delete();
        default:
          return { error: { message: 'Invalid action.' } };
      }
    } catch (e) {
      return { error: { message: e && e.message ? e.message : 'Error' } };
    }
  }
}

module.exports = { PatientController };
