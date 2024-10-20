import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String }, // Store image URL or path
    intensity: { type: String, required: true }
});

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
