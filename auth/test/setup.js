const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URL = mongoServer.getUri();
  process.env.JWT_SECRET="test_jwt_secret";
  await mongoose.connect(process.env.MONGODB_URL, {
    dbName: 'test',
  });

  global.__MONGOSERVER__ = mongoServer;
};
