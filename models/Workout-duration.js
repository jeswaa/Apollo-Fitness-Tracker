import mongoose from 'mongoose';

const WorkoutUser_Duration = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: { type: String, required: true }, // Workout name
    description: { type: String, required: true }, // Workout description
    image: { type: String }, // Store image URL or path
    intensity: { type: String, required: true }, // Intensity leveluser
    duration: { type: Number, required: true }, // Duration in minutes
    date: { type: Date, default: Date.now } // Date of the workout
});

// Create the model
const UserWorkout = mongoose.model('UserWorkout', WorkoutUser_Duration);
export default UserWorkout;
