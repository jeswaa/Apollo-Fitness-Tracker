import mongoose from 'mongoose';

// Define the User Schema
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { 
    timestamps: true 
});


// Create and export the User model
const User = mongoose.model('User', userSchema);
export default User;
