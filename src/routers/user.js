const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const router = new express.Router()

const User = require('../models/User')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})

// Create user
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()

        sendWelcomeEmail(user.email, user.name)

        const token = await user.generateAuthToken()

        return res.status(201).send({ user, token })
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()

        res.send({
            message: 'Logged out successfully'
        })
    } catch (error) {
        res.status(500).send({
            error
        })
    }
})

// Logout user from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send({
            message: 'Logged out all users successfully'
        })
    } catch (error) {
        res.status(500).send({
            error
        })
    }
})

// Get user profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// router.get('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id).exec()
//
//         if (!user) {
//             return res.status(404).send({
//                 error: 'Failed to find the user'
//             })
//         }
//
//         return res.send(user)
//     } catch (error) {
//         return res.status(500).send(error)
//     }
// })

// Update user
router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'email', 'age', 'password']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates'
        })
    }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // }).exec()

        // const user = await User.findById(req.user._id)
        //
        // if (!user) {
        //     return res.status(404).send({
        //         error: 'Failed to find the user'
        //     })
        // }

        updates.forEach(update => req.user[update] = req.body[update])

        await req.user.save()
        return res.send(req.user)
    } catch (error) {
        return res.status(500).send(error)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id).exec()
        //
        // if (!user) {
        //     return res.status(404).send({
        //         error: 'Failed to find the user'
        //     })
        // }

        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)

        return res.send(req.user)
    } catch (error) {
        return res.status(500).send(error)
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize({
            width: 250,
            height: 250
        }).png().toBuffer()

        req.user.avatar = buffer
        await req.user.save()

        res.send({ message: 'Image uploaded successfully' })
    } catch (error) {
        res.status(400).send({error: error.message})
    }
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send({ message: 'Avatar image deleted successfully' })
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error('No avatar found')
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send({ error: error.message})
    }
})

module.exports = router