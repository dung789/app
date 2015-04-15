var mongoose = require('../db.js');

var PostSchema = new mongoose.Schema({
	created: Date,
	edited: Date,
	end: Date,
	confirm: Number,
	url: {type: String, index: true},
	title: String,
	content: String,
	tags: [String],
	map: String,
	view: Number,
	_user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Post', PostSchema);