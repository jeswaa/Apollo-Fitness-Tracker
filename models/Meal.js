import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    description: { type: String },
    calories: { type: Number },
    fats: { type: Number },
    carbs: { type: Number },
    image: { type: String },
    protein: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

const Meal = mongoose.model('Meal', MealSchema);

export default Meal;
