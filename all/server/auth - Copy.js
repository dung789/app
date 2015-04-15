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
		User.findById(id, function(err, user) {
			return done(err, obj(user));
		});
	});

	var obj = function(user){
		return {
			id: user._id,
			avatar: user.avatar,
			username: user.local.username,
			email: user.local.email
		};
	}

	var isAuth = function (req, res, next) {
		if(req.isAuthenticated()){ return next(); }
		else{ res.send(401); }
	};

	passport.use('LogIn', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password'
	},
	function(email, token, done) {
		User.findOne({ 'local.email' :  email }, function(err, user) {
			if (err){ return done(err); }
			else{
				if(user && bcrypt.compareSync(token, user.local.token)){
					
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
				res.json(info);
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
			token = req.body.password;
		console.log(username+"_"+email+"_"+token);
		process.nextTick(function() {
			var query = User.findOne({}).or([{'local.username' : username}, {'local.email' : email}]);

			query.exec(function (err, user) {
				if (err) return done(err);
				if (user) {
					res.json({ us: user.local.username, em: user.local.email });
				}
				else {
					var doc = new User();
					doc.local.username = username;
					doc.local.email = email;
					doc.local.token = bcrypt.hashSync(token, bcrypt.genSaltSync(9));

					doc.save(function(err) {
						if (!err) {
							console.log("created");
							res.json({ message: 'OK'});
						}
						else {
							console.log('Error while saving : ' + err);
							res.json({ message: "err" });
						}
					});
				}
			});
		});
	};

	app.post('/signup', SignUp);
	app.get('/loggedin', function(req, res) {
		res.send(req.isAuthenticated() ? {success : req.user} : {success : false} );
	});
	app.post('/login', SignIn);
	app.post('/logout', function(req, res){
		req.logOut();
		res.send(200);
	});
}