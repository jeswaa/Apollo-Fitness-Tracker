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
        unique: false
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    loggedInAt: {
        type: String,
        default: () => {
            const date = new Date();
            const hours = `0${date.getHours()}`.slice(-2);
            const minutes = `0${date.getMinutes()}`.slice(-2);
            return `${hours}:${minutes}`;
        }
    },
    loggedOutAt: {
        type: String,
        default: () => {
            const date = new Date();
            const hours = `0${date.getHours()}`.slice(-2);
            const minutes = `0${date.getMinutes()}`.slice(-2);
            return `${hours}:${minutes}`;
        }
    }
}, { 
    timestamps: true 
});

// Create and export the User model
const User = mongoose.model('User', userSchema);
export default User;

