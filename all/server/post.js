var formidable = require('formidable'),
	im = require('imagemagick'),
	models = require('./models.js'),
	Post = models.post;

module.exports = function(app, io, fs){

	var copyFile = function(source, target){
		s = fs.createReadStream(source);
		im.crop({
			srcPath: source,
			dstPath: './client/uploads/thumb/'+target,
			width: 240,
			height: 180,
			quality: 0.9,
			gravity: "Center"
		}, 
		function(err, stdout, stderr){
			if (err) throw err;
		});
		t = fs.createWriteStream('./client/uploads/'+target);
		s.pipe(t);
	};

	var createPost = function(req, res, next) {
		var form = new formidable.IncomingForm();
		form.parse(req, function(err, fields, files) {
			var _url = fields.url;
			Post.findOne({ _id: _url }, function (err, doc) {
				if (err) { return next(err); }
				var d = new Date(),
					gt = d.getTime();
				if (doc){
					_url = _url+"-"+gt;
				}
				var doc = new Post();
				doc._user = fields.userId;
				doc._id = _url;
				doc.created = gt;
				doc.edited = gt;
				doc.end = fields.end;
				doc.confirm = 1;
				doc.title = fields.title;

				doc.mode = fields.mode;
				if(fields.mode == 1){
					doc.notes = fields.notes;
					doc.content = fields.content;
				}

				var iname = gt+"-"+files.file.name;
				doc.pimg = iname;

				var tags = JSON.parse(fields.tags);
				for(var i in tags) {
					doc.tags.push(tags[i]);
				};

				doc.save(function(err) {
					if(!err){
						copyFile(files.file.path, iname);
						io.emit('notifyNews', {_id: _url, title: fields.title});
						res.send(doc._id);
					}
					else {
						res.sendStatus(500);
					}
				});
			})
		});
	};

	var createVideo = function(req, res, next) {
		var _url = req.body.url;
		Post.findOne({ _id: _url }, function (err, doc) {
			if (err) { return next(err); }
			var d = new Date(),
				gt = d.getTime();
			if (doc){
				_url = _url+"-"+gt;
			}
			var doc = new Post();
			doc._user = req.body.userId;
			doc._id = _url;
			doc.created = gt;
			doc.edited = gt;
			doc.end = req.body.end;
			doc.confirm = 1;
			doc.title = req.body.title;
			doc.mode = req.body.mode;
			doc.video['vid'] = req.body.vid;
			doc.video['web'] = req.body.web;

			for(var i in req.body.tags) {
				doc.tags.push(req.body.tags[i]);
			};

			doc.save(function(err) {
				if(!err){
					res.send(doc._id);
				}
				else {
					res.sendStatus(500);
				}
			});
		});
	};

	var readPost = function(req, res, next) {
		Post.findById(req.params.id, function(err, doc) {
			if (err) { return next(err); }
			if (doc) {
				if(_null(doc.view)){
					doc.view = 1;
				}
				doc.view = doc.view + _random(1,9);
				doc.save();

				var img = (typeof(doc.pimg) === 'undefined') ? 'http://img.youtube.com/vi/'+doc.video['vid']+'/0.jpg' : 'http://tinbac.com/uploads/thumb/'+doc.pimg;
				var page = {
					title : doc.title,
					keywords: doc.tags,
					description: doc.description || doc.tags,
					image: img
				};
				app.set('page', page);
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var removePost = function(req, res, next) {
		Post.findByIdAndRemove(req.params.id, function(err, doc) {
			if (err) { return next(err); }
			if (doc) {
				if(!_null(doc.pimg)){
					var thumb = './client/uploads/thumb/'+doc.pimg,
						image = './client/uploads/'+doc.pimg;
					if(fs.existsSync(image)) {
						fs.unlinkSync(image);
					}
					if(fs.existsSync(thumb)) {
						fs.unlinkSync(thumb);
					}
				}
				res.sendStatus(200);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var updateEnd = function(req, res, next) {
		Post.update({_id : req.body.id}, { $set: { edited: req.body.edited, end: req.body.end }}, function(err, doc) {
			if (err) { return next(err); }
			if (!doc) { res.sendStatus(400); }
			else { res.sendStatus(200); }
		});
	};

	var news = function(req, res, next) {
		Post.find({'tags' : new RegExp(req.params.id, 'i')})
		.select('_id pimg title notes mode video')
		.limit(5)
		.sort({
			created: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var tag = function(req, res, next) {
		var offset = req.params.num - 1;
		var tagId = req.params.id;
		Post.find({'tags' : new RegExp(tagId, 'i')})
		.skip(offset*6)
		.limit(6)
		.sort({
			created: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				app.set('title', doc.title);
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var taglist = function(req, res, next) {
		var offset = req.params.num - 1;
		var tagId = req.params.id;
		Post.find({'tags' : new RegExp(tagId, 'i')})
		.select('_id pimg title notes mode video')
		.skip(offset*12)
		.limit(12)
		.sort({
			created: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				app.set('title', doc.title);
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var postUser = function(req, res, next) {
		var offset = req.params.num - 1;
		var tagId = req.params.id;
		Post.find({'_user' : new RegExp(tagId, 'i')})
		.select('_id pimg title notes mode video')
		.skip(offset*12)
		.limit(12)
		.sort({
			created: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var moreTag = function(req, res, next) {
		Post.find({"edited": { $lt: req.params.lt }, tags: { $in: req.body.tags } })
		.select('_id pimg title notes mode video')
		.limit(8)
		.sort({
			created: 'desc'
		})
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var _null = function (val) {
		if(typeof(val) === 'undefined' || val === null){return true;}
		else {return false;}

	};

	var _random = function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};

	app.get('/api/news/:id', news);
	app.get('/api/post/:id', readPost);
	app.post('/api/post', createPost);
	app.post('/api/video', createVideo);
	app.delete('/api/post/:id', removePost);
	app.post('/api/end', updateEnd);
	app.post('/api/more/:lt', moreTag);

	app.get('/api/tag/:id/:num', tag);
	app.get('/api/taglist/:id/:num', taglist);
	app.get('/api/user/:id/:num', postUser);
}