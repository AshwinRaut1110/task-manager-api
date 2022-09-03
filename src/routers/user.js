const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail }  = require('../email/email');

const router = new express.Router(); // creating a new router

// user creation endpoint
router.post('/users', async (req, res) => {

    const user = new User(req.body);

    try {
        const token = await user.generateAuthToken();
        sendWelcomeEmail(user.name, user.email);
        res.status(201).send({
            user,
            token
        });
    } catch (error) {
        res.status(400).send(error);
    }
});

// user login endpoint
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({
            user,
            token
        });
    } catch (e) {
        res.status(400).send();
    }
});

// logout user from current sessions/device endpoint
router.post('/users/logout', auth, async (req, res) => {

    try {
        const authToken = req.token;

        req.user.tokens = req.user.tokens.filter(token => token.token != authToken);
        await req.user.save();
        res.send('successfully logged out');

    } catch (e) {
        res.status(500).send(e);
    }

});

// logout user from all sessions/devices endpoint
router.post('/users/logoutAll', auth, async (req, res) => {

    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('successfully logged out of all the devices');

    } catch (e) {
        res.status(500).send(e);
    }

});

// Personal Profile fetching endpoint
router.get('/users/me', auth, async (req, res) => { // we pass the middleware in as an argument
    res.send(req.user);
});

// user updation endpoint
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body); // used to get an array of object keys
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    // every call the callback fxn for every element it will return true if callback return true
    // for all the items else false
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));


    if (!isValidOperation) {
        return res.status(400).send({ "error": "Invalid updates." });
    }

    try {

        updates.forEach(update => req.user[update] = req.body[update]);

        await req.user.save();

        res.send(req.user);

    } catch (error) {
        res.status(400).send(error);
    }

});

// user deletion endpoint
router.delete('/users/me', auth, async (req, res) => {

    try {
        console.log(req.user);
        await req.user.remove();
        sendCancelationEmail(req.user.name, req.user.email);
        res.send(req.user);

    } catch (error) {
        res.status(500).send(error);
    }

});


// setting up multer for accepting profile pics
const avatar = multer({
    limits: {
        fileSize: 1000000 // million bytes - 1MB
    },
    fileFilter(req, file, cb) {

        // only allowing image formats
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return cb(new Error('file must be an image.')); // rejects the file with an error
        }

        cb(undefined, true); // accepts the file
    }
});

// avatar upload endpoint
router.post('/users/me/avatar', auth, avatar.single('avatar'), async (req, res) => {


    try {

        const buffer = await sharp(req.file.buffer).resize({
            width: 250,
            height: 250
        }).png().toBuffer();

        req.user.avatar = buffer; // returns the binary buffer of the image
        await req.user.save();
        res.send();
    } catch (e) {
        res.send({ 'error': 'Unable to upload avatar' });
    }

}, (error, req, res, next) => {
    // this funciton runs if the middleware throws an error
    res.status(400).send({ 'error': error.message });
});

// avatar delete endpoint
router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined;
    await req.user.save();
    res.send();

});

// avatar serving endpoint
router.get('/users/:id/avatar', async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            return res.status(404).send({ 'error': 'Avatar not found.' });
        }

        res.set('Content-Type', 'image/png');

        res.send(user.avatar);

    } catch (e) {
        res.send({ 'error': 'Could not fetch the avatar.' });
    }
});

module.exports = router;