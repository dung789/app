var models = require('./models.js'),
	Chat = models.chat,
	Message = models.message;

module.exports = function(app){

	var moreroom = function(req, res, next) {
		Chat.find({ 'room' : req.body.room, 'time': { $lt: req.body.time } })
		.limit(10)
		.sort({
			time: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.json(null);
			}
		});
	};

	var moreprivate = function(req, res, next) {
		Message.find({ 
		$or: [
			{ $and: [{from: req.body.from}, {to: req.body.to}] },
			{ $and: [{from: req.body.to}, {to: req.body.from}] }
		], 'time': { $lt: req.body.time } })
		.limit(10)
		.sort({
			time: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.json(null);
			}
		});
	};

	app.post('/moreroom', moreroom);
	app.post('/moreprivate', moreprivate);
}