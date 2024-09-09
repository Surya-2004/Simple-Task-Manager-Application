const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true, unique: true },
    sequence_value: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const taskSchema = new mongoose.Schema({
    customid: { type: Number, required: true, unique: true }, // Changed to Number
    task: { type: String, required: true },
    description: { type: String }
});
const Task = mongoose.model('Task', taskSchema);

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
        const customid = counter.sequence_value; // Keep as number
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
        const numericId = Number(id); // Convert to number
        if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });

        const task = await Task.findOne({ customid: numericId });
        if (task) {
            console.log("Got the task");
            await Task.deleteOne({ customid: numericId });
            await Counter.findByIdAndUpdate(
                { _id: 'taskid' },
                { $inc: { sequence_value: -1 } },
                { new: true }
            );
            return res.status(200).json({ message: "Successfully Deleted." });
        } else {
            console.log("Not found")
            return res.status(404).json({ message: "Task not found." });
        }
    } catch (err) {
        console.log("DB error", err.message);
        return res.status(500).json({ message: "Server Error", error: err.message });
    }
});

app.put('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { task, description } = req.body;
        const numericId = Number(id);

        console.log("Updating task with ID:", numericId); // Log for debugging
        console.log("New task data:", { task, description });

        if (isNaN(numericId)) return res.status(400).json({ error: "Invalid ID format" });

        const updatedTask = await Task.findOneAndUpdate(
            { customid: numericId },
            { task, description },
            { new: true }
        );

        if (updatedTask) {
            console.log("Task updated:", updatedTask); // Log to verify
            res.status(200).send({ message: "Task Updated Successfully", updatedTask });
        } else {
            console.log("Task Not Found!");
            res.status(404).send({ error: "Task not found" });
        }
    } catch (error) {
        console.log("Error: ", error.message);
        res.status(500).send({ message: "Server Error", error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
