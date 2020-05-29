const mongoose = require('mongoose');
const Promise = require('bluebird');


mongoose.Promise = Promise; // plug-in bluebird as mongoose Promise

// to export: init mongo connection, set logging
const init = () => {
  connectMongo();
  mongoose.connection.on('connected', () => console.log('Connected to mongodb'));
  mongoose.connection.on('error', err => console.error('Could not connect to mongodb', err));
};


// connect to mongo host, set retry on initial fail
const connectMongo = () => {
  mongoose.connect('mongodb://localhost/chatting',{useNewUrlParser:true, useUnifiedTopology:true} )
    .catch(err => {
      console.error('Could not connect to database ', err);
      setTimeout(connectMongo, 2000);
    });
}


module.exports = init;