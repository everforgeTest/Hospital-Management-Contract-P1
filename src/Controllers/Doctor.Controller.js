const { DoctorService } = require('../Services/Domain.Services/Doctor.service');

class DoctorController {
  constructor(message) {
    this.message = message || {};
    this.service = new DoctorService(this.message);
    //abc
    //abc
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

module.exports = { DoctorController };
