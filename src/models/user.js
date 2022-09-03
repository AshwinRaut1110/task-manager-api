const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email address.')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannont contain password.');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            // validate enables us to use custom validation for our data
            if (value < 0) {
                throw new Error('Age must be a positive number.');
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

// setting virtual property for task relationship
UserSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

// hash the password before saving
// pre used to perform an action before an event occurs, in this case saving of document
UserSchema.pre('save', async function (next) {
    // this is a reference to the document being saved
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next() // tells mongoose when processing is done
});

UserSchema.pre('remove', async function(next){

    await Task.deleteMany({ owner: this._id });
    
    next();

});

UserSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    
    if (!user) {
        throw new Error('Incorrect credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        throw new Error('Incorrect credentials');
    }

    return user;
}

UserSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7 days' });
    user.tokens.push({ token });
    await user.save();
    return token;
}

UserSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.tokens;
    delete user.password;
    delete user.avatar;

    return user;
}

// User Model
const User = mongoose.model('User', UserSchema);

module.exports = User;