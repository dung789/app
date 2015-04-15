var mongoose = require('../db.js');

var userSchema = mongoose.Schema({
    avatar: {
        type: String,
        default : 'uploads/user.png'
    },
    local: {
        username: String,
        email: String,
        token: String
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    }

});

module.exports = mongoose.model('User', userSchema);