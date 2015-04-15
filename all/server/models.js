var mongoose = require('mongoose');
	mongoose.connect('mongodb://pnadAdmin:thienha6789@localhost:27017/db_allktd');

var UserSchema = mongoose.Schema({
	_id: {type: String, index: true},
	avatar: {
		type: String,
		default : 'user.png'
	},
	email: String,
	password: String,
	token: String,
	info: {
		gender: Number,
		birthday: String,
		fullname: String,
		address: String,
		phone: Number,
		note: String
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

var PostSchema = new mongoose.Schema({
	_id: {type: String, index: true},
	created: Number,
	edited: Number,
	end: Number,
	confirm: Number,
	mode: Number,
	title: String,
	notes: String,
	content: String,
	pimg: String,
	video: {
		vid: String,
		web: String
	},
	tags: [String],
	map: String,
	view: Number,
	like: [String],
	_user: {type: String, ref: 'User'}
});

var ChatSchema = new mongoose.Schema({
	room: String,
	from: {type: String, ref: 'User'},
	text: String,
	time: Number
});

var MessageSchema = new mongoose.Schema({
	from: {type: String, ref: 'User'},
	to: String,
	text: String,
	time: Number,
	view: Number
});


module.exports = {
	user: mongoose.model('User', UserSchema),
	post: mongoose.model('Post', PostSchema),
	chat: mongoose.model('Chat', ChatSchema),
	message: mongoose.model('Message', MessageSchema)
};

