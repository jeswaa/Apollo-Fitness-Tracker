import mongoose from 'mongoose';

// Define the review schema
const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        minlength: 5, // Ensuring a minimum length for meaningful comments
        maxlength: 500, // Reasonable maximum length for comments
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Review model
const Review = mongoose.model('Review', reviewSchema);

// Export the model
export default Review;
