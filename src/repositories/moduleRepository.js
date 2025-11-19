const Module = require('../models/module');

class ModuleRepository {
  async create(moduleData) {
    return Module.create(moduleData);
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, category } = options;
    const query = category ? { category } : {};
    return Module.find(query)
      .populate('createdBy', 'email')
      .populate('enrolledUsers', 'email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
  }

  async findById(id) {
    return Module.findById(id).populate('createdBy', 'email').populate('enrolledUsers', 'email');
  }

  async update(id, updateData) {
    return Module.findByIdAndUpdate(id, updateData, { new: true }).populate('enrolledUsers', 'email');
  }

  async delete(id) {
    return Module.findByIdAndDelete(id);
  }

  async enrollUser(moduleId, userId) {
    return Module.findByIdAndUpdate(
      moduleId,
      { $addToSet: { enrolledUsers: userId } },
      { new: true }
    ).populate('enrolledUsers', 'email');
  }

  async getEnrollments(moduleId) {
    const module = await Module.findById(moduleId).populate('enrolledUsers', 'email');
    return module ? module.enrolledUsers.length : 0;
  }
}

module.exports = new ModuleRepository();