const moduleRepo = require('../repositories/moduleRepository');

class ModuleService {
  async createModule(moduleData, userId) {
    moduleData.createdBy = userId;
    return moduleRepo.create(moduleData);
  }

  async getAllModules(options) {
    return moduleRepo.findAll({}, options);
  }

  async getModuleById(id) {
    const module = await moduleRepo.findById(id);
    if (!module) throw new Error('Module not found');
    return module;
  }

  async updateModule(id, updateData, userId, userRole) {
    const module = await this.getModuleById(id);
    if (module.createdBy._id.toString() !== userId && userRole !== 'admin') { 
      throw new Error('Not authorized');
    }
    return moduleRepo.update(id, updateData);
  }

  async deleteModule(id, userId, userRole) {
    const module = await this.getModuleById(id);
    if (module.createdBy._id.toString() !== userId && userRole !== 'admin') {  
      throw new Error('Not authorized');
    }
    return moduleRepo.delete(id);
  }

  async enrollInModule(moduleId, userId) {
    return moduleRepo.enrollUser(moduleId, userId);
  }

  async getEnrolledModules(userId) {
    const modules = await moduleRepo.findAll({ enrolledUsers: userId });
    return modules;
  }

  async getEnrollmentCount(moduleId) {
    return moduleRepo.getEnrollments(moduleId);
  }
}

module.exports = new ModuleService();