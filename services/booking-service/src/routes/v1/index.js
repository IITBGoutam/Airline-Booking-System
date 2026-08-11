const express = require('express');

const { bookingController } = require('../../controllers');

const router = express.Router();

router.post('/bookings', bookingController.create);
router.get('/bookings/:id', bookingController.get);
router.patch('/bookings/:id/cancel', bookingController.cancel);

module.exports = router;
