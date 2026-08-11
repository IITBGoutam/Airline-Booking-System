const { FlightRepository } = require('../repository');
const { AVAILABILITY_TOPIC } = require('../config');
const { publish } = require('../utils/kafka/producer');

class FlightService {
  constructor() {
    this.flightRepository = new FlightRepository();
  }

  async createFlight(data) {
    return this.flightRepository.create(data);
  }

  async getFlights(filter) {
    return this.flightRepository.getAll(filter);
  }

  async getFlight(id) {
    return this.flightRepository.get(id);
  }

  async updateSeats(flightId, seats, dec) {
    const flight = await this.flightRepository.updateRemainingSeats(flightId, seats, dec);

    // Broadcast the new availability so interested consumers (dashboards,
    // caches, notifications) converge asynchronously -> real-time availability
    // updates with eventual consistency.
    await publish(AVAILABILITY_TOPIC, {
      event: 'SEATS_UPDATED',
      key: flight.id,
      data: {
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        remainingSeats: flight.totalSeats,
        change: dec ? -Number(seats) : Number(seats),
      },
      occurredAt: new Date().toISOString(),
    });

    return flight;
  }
}

module.exports = FlightService;
