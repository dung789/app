var models = require('./models.js'),
	Chat = models.chat,
	Message = models.message;
module.exports = function(io){
	var list = {};
	io.on('connection', function (socket) {

		socket.on('joinRoom', function (room) {
			_join(room);
		});

		socket.on('switchRoom', function(newroom){
			_leave(socket.room);
			_join(newroom);
		});

		socket.on('addUser', function(username){
			socket.me = username;
			//send user online
			list[username] = socket.id;
			var keys = (function(o){var ks=[]; for(var k in o) ks.push(k); return ks})(list);
			io.emit('listUser', keys);
			_getM(username);
		});

		socket.on('sendTxt', function (data) {
			socket.broadcast.to(socket.room).emit('updateTxt', data);
			_save(data);
		});

		// private
		socket.on('selectUser', function(from){
			socket.you = from;
		});

		socket.on('sendPrivate', function (data) {
			socket.to(list[socket.you]).emit('updatePrivate', data);
			_saveM(data);
		});

		socket.on('findPrivate', function(data){
			_readM(data);
		});
		//end private
		socket.on('leftRoom', function(){
			_out();
		});

		socket.on('disconnect', function(){
			_out();
		});

		var _read = function(r){
			Chat.find({room : r}).sort({time: 'desc'}).limit(10).exec(function(err, doc){
				if (err) { return handleError(err); }
				socket.emit('currentRoom', r, doc);
			});
		};

		var _save = function (data){
			var doc = new Chat();
				doc.room = socket.room;
				doc.from = data.from;
				doc.text = data.message;
				doc.time = data.time;
				doc.save(function(err) {
					if (err) return handleError(err);
				});
		};

		var _getM = function(username){
			Message.find({to: username, view: 0}).select('_id from').exec(function(err, doc){
				if (err) { return handleError(err); }
				if(doc){
					socket.emit('userPrivate', doc);
				}
			});
		};

		var _readM = function(data){
			Message.find({ 
				$or: [
					{ $and: [{from: data.from}, {to: data.to}] },
					{ $and: [{from: data.to}, {to: data.from}] }
				]
			}).sort({time: 'desc'}).limit(10).exec(function(err, doc){
				if (err) { return handleError(err); }
				socket.emit('contentPrivate', doc);
				if (doc.length > 0) {
					_viewM(data);
				}

			});
		};

		var _viewM = function(data){
			Message.update({from: data.from, to: data.to}, {$set: {view : 1}}, {multi: true}, function(err) {
				if (err) return handleError(err);
			});
		};

		var _saveM = function (data){
			var doc = new Message();
				doc.from = data.from;
				doc.to = socket.you;
				doc.text = data.message;
				doc.time = data.time;
				doc.view = 0;
				doc.save(function(err) {
					if (err) return handleError(err);
				});
		};

		var _join = function (room){
			socket.join(room);
			socket.room = room;
			_read(room);
			socket.broadcast.to(room).emit('notifyRoom', 'Có 1 người khách vừa vào phòng chat ' + room);
		};

		var _out = function(){
			socket.broadcast.emit('notifyRoom', _getName()+' đã rời phòng chat !');
			socket.broadcast.emit('offline', socket.me);
			delete list[socket.me];
		};

		var _leave = function(room){
			socket.broadcast.to(room).emit('notifyRoom', _getName()+' đã rời phòng chat !');
			socket.leave(room);
		};

		var _getName = function(){
			return (typeof(socket.me) === 'undefined') ? 'Có 1 người khách' : socket.me ;
		}

	});
}