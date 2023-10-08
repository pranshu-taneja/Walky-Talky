import mongoose from "mongoose";
// Define the schema for the chat message
const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        // required: true,
    },
    timestamp: {
        type: Date,
        // default: Date.now,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

// Define the schema for the chat room
const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        unique: true,
        required: true,
    },
    msg: [messageSchema], // Array of messages using the messageSchema
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'], // You can customize the status options as needed
        default: 'active',
        required: true,
    },
});

// Create the model for the chat room
const Room = mongoose.model('Room', roomSchema);

export default Room;


