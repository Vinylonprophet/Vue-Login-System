const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000, // 5秒超时
});

module.exports = {
  client,
  uri
};
