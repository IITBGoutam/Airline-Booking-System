-- Creates one database per microservice (database-per-service pattern).
-- Runs automatically on first startup of the Postgres container.
CREATE DATABASE auth_db;
CREATE DATABASE flight_db;
CREATE DATABASE booking_db;
