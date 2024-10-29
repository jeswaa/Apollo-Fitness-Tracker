import mongoose from 'mongoose';

// Define the schema for completed workouts
const completedWorkoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
    },
    workoutId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workout', // Reference to the Workout model
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    intensity: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true // Duration in minutes
    },
    image: {
        type: String, // URL or path to the workout image
        required: false // Optional field
    },
    completedAt: {
        type: Date,
        default: Date.now // Automatically set the date when the workout was completed
    }
});

// Create the CompletedWorkout model
const CompletedWorkout = mongoose.model('CompletedWorkout', completedWorkoutSchema);
export default CompletedWorkout;
