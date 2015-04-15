var db = require('mongoose');
db.connect('mongodb://pnadAdmin:thienha6789@localhost:27017/db_allktd');
module.exports = db;