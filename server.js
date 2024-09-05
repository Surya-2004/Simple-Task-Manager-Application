const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

let tasksArr = [];

app.get('/tasks', (req, res)=>{
    const body = req.body;
    return res.status(200).send({tasksArr: tasksArr});
});

app.post('/tasks', (req, res)=>{
    const body = req.body;
    const task = body.task;
    const description = body.description;
    tasksArr.push({ task: task, description: description });
    return res.status(201).send({message: "Data added successfully"});
});

app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id < 1 || id > tasksArr.length) {
        return res.status(400).send({ message: "Invalid task ID" });
    }
    if (tasksArr[id - 1] !== undefined) {
        tasksArr.splice(id - 1, 1);
        return res.status(200).send({ message: "Data deleted successfully" });
    } else {
        return res.status(204).send({ message: "Data doesn't exist or has already been removed" });
    }
});


app.listen(PORT, ()=>{
    console.log("Server running...");
});