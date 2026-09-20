const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, settingsController.getSettings);
router.post('/profile', ensureAuthenticated, settingsController.updateProfile);
router.post('/password', ensureAuthenticated, settingsController.updatePassword);

module.exports = router;