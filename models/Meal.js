import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    calories: { type: Number, required: true },
    carbs: { type: Number, required: true },
    protein: { type: Number, required: true },
    fats: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Meal = mongoose.model('Meal', MealSchema);

export default Meal;
