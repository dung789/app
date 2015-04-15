var express = require('express'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server),
	fs = require('fs'),
	methodOverride = require('method-override'),
	bodyParser = require('body-parser'), // pull information from HTML POST (express4)
	session = require('express-session'),
	cookieParser = require('cookie-parser');
	csrf = require('csurf'),
	doT = require('dot');

app.set('views', './client/views');
app.set('view cache', false);
app.set('view engine', 'html');
app.engine('.html', doT.__express);
//1. configure
app.use(methodOverride());	// simulate DELETE and PUT
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	secret: 'bimat)!@#$%^&*(',
	resave: true,
	saveUninitialized: true
}));
app.use(csrf({ cookie: true }));
app.use(function(req, res, next){
	res.cookie('XSRF-TOKEN', req.csrfToken());
	next();
});

app.use(express.static(__dirname + '/client'));

server.listen(80, function(){
	console.log('localhost:80');
});

require('./server/chat.js')(io);

require('./server/message.js')(app);

require('./server/auth.js')(app);

require('./server/post.js')(app,io,fs);

app.get('*', function(req, res){
	var page = app.get('page') || '';
	res.render('layout', {
				title: page['title'] || 'Tin Bạc',
				keywords: page['keywords'] || ["rao vat","tin tuc","infographic","giai tri","suc khoe","lam dep",
						"truyen tranh","haivl","hai huoc","vui cuoi","funny","meo vat","anh vui","photo","video","phim hai"],
				description: page['description'] || 'Tin bạc cổng giải trí, tán gẫu, đăng tin, rao vặt và có thể tự động xóa bài viết',
				image: page['image'] || 'http://tinbac.com/css/tinbac.png'
	});
	app.set('page', null);
});