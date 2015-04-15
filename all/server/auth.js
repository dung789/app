var bcrypt = require('bcryptjs'),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	models = require('./models.js'),
	User = models.user;

module.exports = function(app) {

	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser(function(user, done) {
		return done(null, user.id);
	});

	// kiểm tra session và dùng id để đăng nhập
	passport.deserializeUser(function(id, done) {
		User.findById(id, '_id avatar email facebook google', function(err, user) {
			return done(err, obj(user));
		});
	});

	var obj = function(user){
		return {
			id: user._id,
			avatar: user.avatar,
			email: user.email,
			facebook: user.facebook,
			google: user.google
		};
	}

	var isAuth = function (req, res, next) {
		if(req.isAuthenticated()){ return next(); }
		else{ res.sendStatus(401); }
	};

	passport.use('LogIn', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password'
	},
	function(email, password, done) {
		User.findOne({ 'email' :  email }, '_id avatar email password facebook google', function(err, user) {
			if (err){ return done(err); }
			else{
				if(user && bcrypt.compareSync(password, user.password)){
					return done(null, obj(user));// all is well, return successful user
				}
				else{
					return done(null, false, { success: false });
				}
			}
		});
	}));

	var SignIn = function(req, res, next) {
		passport.authenticate('LogIn', function(err, user, info) {
			if (err) { return next(err); } 
			if (!user) {
				res.sendStatus(401);
			}
			else{
				req.logIn(user, function(err) {
					if (err) { return next(err); }
					res.json({ success: user });
				});
			}
		})(req, res, next);
	};

	var SignUp = function(req, res) {

		var username = req.body.username,
			email = req.body.email,
			password = req.body.password;
		process.nextTick(function() {
			var query = User.findOne({}).select('_id email').or([{'_id' : username}, {'email' : email}]);

			query.exec(function (err, user) {
				if (err) return done(err);
				if (user) {
					res.json({ us: user._id, em: user.email });
				}
				else {
					var doc = new User();
					doc._id = username;
					doc.email = email;
					doc.password = bcrypt.hashSync(password, bcrypt.genSaltSync(9));
					doc.token = _random(32);

					doc.save(function(err) {
						if (!err) {
							res.json({ message: 'OK'});
						}
						else {
							res.json({ message: "err" });
						}
					});
				}
			});
		});
	};

	var forgot = function(req, res, next){
		User.findOne({email : req.body.email}, '_id', function(err, user) {
			if (err) { return next(err); }
			if (!user){ res.sendStatus(404); }
			else{
				var nodemailer = require('nodemailer'),
				link = req.protocol + '://' + req.get('host') + '/changepass/' + user.token,
				transporter = nodemailer.createTransport({
					service: 'Gmail',
					auth: {
						user: 'phivushop@gmail.com',
						pass: 'tothiphi'
					}
				});
				transporter.sendMail({
					from: 'admin phivushop@gmail.com',
					to: user.email,
					subject: 'Thay đổi mật khẩu',
					html: '<h4>Hãy click vào link bên dưới để thay đổi mật khẩu</h4><a href="'+link+'">Bấm vào đây để đổi mật khẩu mới</a>'
				}, function(error, info){
					if(error){
						console.log(error);
					}
					else{
						console.log(info);
					}
				});
				res.sendStatus(200);
			}
		});
	};

	var password = function(req, res, next){
		var tk = _random(32);
		User.update({token : req.body.token}, { $set: { password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(9)), token: tk }}, function(err, user) {
			if (err) { return next(err); }
			if (!user) { res.sendStatus(400); }
			else { res.sendStatus(200); }
		});
	};

	var info = function(req, res, next){
		User.findById(req.params.id, '_id avatar info', function (err, user) {
			if (err) { return next(err); }
			if (user){ res.json(user); }
			else{ res.sendStatus(404); }
		});
	};

	var user = function(req, res, next){
		User.findById(req.params.id, '_id info', function (err, user) {
			if (err) { return next(err); }
			if (user){
				user.info['gender'] = req.body.gender;
				user.info['birthday'] = req.body.birthday;
				user.info['fullname'] = req.body.fullname;
				user.info['address'] = req.body.address;
				user.info['phone'] = req.body.phone;
				user.info['note'] = req.body.note;
				user.save(function(err) {
					if(!err){
						res.sendStatus(200);
					}
					else {
						res.sendStatus(500);
					}
				});
			}
			else{
				res.sendStatus(404);
			}
		});
	};

	var img = function(req, res, next) {
		var formidable = require('formidable'),
			im = require('imagemagick'),
			form = new formidable.IncomingForm();

		form.parse(req, function(err, fields, files) {
			console.log(fields.id)
			User.findById(fields.id, '_id avatar', function (err, user) {
				if (err) { return next(err); }
				if (user){
					var img = fields.id+"-"+files.file.name;
					user.avatar = img;
					user.save(function(err) {
						if(!err){
							im.crop({
								srcPath: files.file.path,
								dstPath: './client/uploads/user/'+img,
								width: 128,
								height: 128,
								quality: 0.9,
								gravity: "Center"
							}, 
							function(err, stdout, stderr){
								if (err) throw err;
							});
							res.sendStatus(200);
						}
						else {
							res.sendStatus(500);
						}
					});
				}
				else{
					res.sendStatus(404);
				}
			});
		});

	};

	var finduser = function(req, res, next) {
		User.find({'_id' : new RegExp(req.params.id, 'i')})
		.select('_id')
		.exec(function(err, doc){
			if (err) { return next(err); }
			if (doc.length > 0) {
				res.json(doc);
			}
			else{
				res.json([{_id: 'không tìm thấy'}]);
			}
		});
	};

	var _random = function(length) {
	    return Math.round(Math.random() * Math.pow(36, length)).toString(36);
	}

	app.post('/signup', SignUp);
	app.get('/loggedin', function(req, res) {
		res.send(req.isAuthenticated() ? {success : req.user} : {success : false} );
	});
	app.post('/login', SignIn);
	app.post('/logout', function(req, res){
		req.logout();
		res.sendStatus(200);
	});
	app.post('/forgot', forgot);
	app.post('/password', password);

	app.post('/info/:id', info);
	app.post('/user/:id', user);
	app.post('/avatar', img);

	app.get('/finduser/:id', finduser);
}