// database/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connection = async () => {
  try {
    mongoose.set('strictQuery', true); // Optional: for strict MongoDB queries

    // Connect to MongoDB using the URI from environment variables
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true, // Enables automatic creation of indexes (optional)
    });

    console.log('MongoDB connected successfully!');

    // Event listeners for connection
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB');
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit if there is a connection error
  }
};

// Exporting connection as default
export default connection;
