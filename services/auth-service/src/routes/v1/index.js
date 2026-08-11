const express = require('express');

const { authController } = require('../../controllers');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/isAuthenticated', authController.isAuthenticated);
router.get('/isAdmin', authController.isAdmin);

module.exports = router;
