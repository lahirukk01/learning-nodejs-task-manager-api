const express = require('express')
const router = new express.Router()
const Task = require('../models/Task')
const auth = require('../middleware/auth')

// Create task
router.post('/tasks', auth, async (req, res) => {
    try {
        // const task = new Task(req.body)
        const task = new Task({
            ...req.body,
            owner: req.user._id
        })
        await task.save()

        return res.status(201).send(task)
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Get user tasks
// GET /tasks?completed=true
// GET /tasks?limit=2&skip=2
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }


    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        return res.send(req.user.tasks)
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Get user task
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        }).exec()

        if (!task) {
            return res.status(404).send({
                error: 'Failed to find the user'
            })
        }

        return res.send(task)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Update user task
router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates'
        })
    }

    try {
        const task = await Task.findOneAndUpdate({
            _id: req.params.id,
            owner: req.user._id
        }, req.body, {
            new: true,
            runValidators: true
        }).exec()

        if (!task) {
            return res.status(404).send({
                error: 'Failed to find the user'
            })
        }

        return res.send(task)
    } catch (error) {
        return res.status(500).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        }).exec()

        if (!task) {
            return res.status(404).send({
                error: 'User has no such task'
            })
        }

        return res.send(task)
    } catch (error) {
        return res.status(500).send(error)
    }
})

module.exports = router