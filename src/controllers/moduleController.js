const moduleService = require('../services/moduleService');

exports.getAllModules = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const modules = await moduleService.getAllModules({ page, limit, category });
    res.json({ modules, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.getEnrolledModules = async (req, res) => {
  try {
    const modules = await moduleService.getEnrolledModules(req.user.id);
    res.json({ modules });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.createModule = async (req, res) => {
  try {
    const module = await moduleService.createModule(req.body, req.user.id);
    res.status(201).json(module);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.getModule = async (req, res) => {
  try {
    const module = await moduleService.getModuleById(req.params.id);
    res.json(module);
  } catch (error) {
    res.status(404).json({ msg: error.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const module = await moduleService.updateModule(req.params.id, req.body, req.user.id);
    res.json(module);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    await moduleService.deleteModule(req.params.id, req.user.id);
    res.json({ msg: 'Module deleted' });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.enrollModule = async (req, res) => {
  try {
    const module = await moduleService.enrollInModule(req.params.id, req.user.id);
    res.json(module);
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};

exports.getEnrollmentCount = async (req, res) => {
  try {
    const count = await moduleService.getEnrollmentCount(req.params.id);
    res.json({ enrolledUsers: count });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
};