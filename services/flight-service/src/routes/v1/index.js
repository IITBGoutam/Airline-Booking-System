const express = require('express');

const { flightController } = require('../../controllers');

const router = express.Router();

router.post('/flights', flightController.create);
router.get('/flights', flightController.getAll);
router.get('/flights/:id', flightController.get);
router.patch('/flights/:id/seats', flightController.updateSeats);

module.exports = router;
