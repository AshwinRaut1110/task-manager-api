const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

// task creation endpoint
router.post('/tasks', auth, async (req, res) => {

    // const task = new Task(req.body);

    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        res.status(201).send(await task.save());
    } catch (error) {
        res.status(400).send(error);
    }

});

// multiple task fetching endpoint
// GET /tasks?completed=true|false
// GET /tasks?limit=5&skip=10
// GET /tasks?sortBy=createdAt:dsc
router.get('/tasks', auth, async (req, res) => {

    const match = {} , sort = {};

    if(req.query.completed){
        match.completed = req.query.completed === 'true' ? true : false;
    }

    if(req.query.sortBy){
        const sort_params = req.query.sortBy.split(':');
        sort[sort_params[0]] = sort_params[1] === 'dsc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                // pagination
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                // 1=acsending - oldest first and -1 descending - newest first
                sort
            }
        });
        res.status(200).send(req.user.tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

// single task fetching endpoint
router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id;

    try {

        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        res.status(200).send(task);

    } catch (error) {
        res.status(500).send(error);
    }
});

// task updation endpoint
router.patch('/tasks/:id', auth, async (req, res) => {

    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ 'error': 'Invalid Updates.' });
    }
    
    try {

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach(update => task[update] = req.body[update]);

        await task.save();

        res.send(task)

    } catch (error) {
        res.status(400).send(error);
    }

});

// task deletion endpoint
router.delete('/tasks/:id', auth, async (req, res) => {

    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({ 'error': 'task not found.' });
        }
        
        res.send(task);

    } catch (error) {
        res.status(400).send(error);
    }

});

module.exports = router;