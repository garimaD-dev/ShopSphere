const { Redis } = require('ioredis');

let redis;

if (process.env.NODE_ENV === 'test') {
  redis = {
    set: async () => 'OK',
    get: async () => null,
    del: async () => 0,
    on: () => {},
  };
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });
}

module.exports = redis;