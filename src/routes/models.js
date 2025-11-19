const express = require('express');
const {
  getAllModules, getEnrolledModules, createModule, getModule,
  updateModule, deleteModule, enrollModule, getEnrollmentCount
} = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const adminRole = require('../middleware/role');
const { validateModule } = require('../middleware/validation');

const router = express.Router();

router.get('/', getAllModules);

router.use(auth);

// User
router.get('/enrolled', getEnrolledModules);
router.post('/:id/enroll', enrollModule);

// Admin
router.post('/', adminRole(['admin']), validateModule, createModule);
router.get('/:id', getModule);
router.put('/:id', adminRole(['admin']), validateModule, updateModule);
router.delete('/:id', adminRole(['admin']), deleteModule);
router.get('/:id/enrollments', adminRole(['admin']), getEnrollmentCount);

module.exports = router;