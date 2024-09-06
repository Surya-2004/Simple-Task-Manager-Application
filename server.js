const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port if available

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connection to database established.");
})
.catch((error) => {
    console.error("Connection Error: ", error);
});

// Define Schemas and Models
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true, unique: true },
    sequence_value: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const taskSchema = new mongoose.Schema({
    customid: { type: Number, required: true, unique: true },
    task: { type: String, required: true },
    description: { type: String }
});
const Task = mongoose.model('Task', taskSchema);

// Define Routes
app.get('/tasks', async (req, res) => {
    try {
        const items = await Task.find().sort({ customid: 1 });
        const tasksArr = items.map(item => {
            const { task, description } = item.toObject();
            return { task, description };
        });
        res.status(200).json({ tasksArr });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const { task, description } = req.body;
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'taskid' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );
        const customid = counter.sequence_value;
        const newTask = new Task({ customid, task, description });
        await newTask.save();
        return res.status(201).json({ message: "Data added successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findOne({ customid: id });
        if (task) {
            await Task.deleteOne({ customid: id });
            return res.status(200).json({ message: "Successfully Deleted." });
        } else {
            return res.status(404).json({ message: "Task not found." });
        }
    } catch (err) {
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
