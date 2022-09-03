const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean, 
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // setting up refernce/relationship to user, 
    }
}, {
    timestamps: true
});

// Task Model
const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
