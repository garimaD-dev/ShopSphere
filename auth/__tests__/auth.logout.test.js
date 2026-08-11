jest.mock('../src/db/redis', () => ({
  set: jest.fn().mockResolvedValue('OK')
}));

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const User = require('../src/models/user.model');
const redis = require('../src/db/redis');

beforeAll(async () => {
  await require('../test/setup')();
});

afterAll(async () => {
  await mongoose.disconnect();
  await global.__MONGOSERVER__.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('GET /api/auth/logout', () => {
  let token;
  let authCookie;

  beforeEach(async () => {
    const password = await bcrypt.hash('Password123!', 10);
    const user = await User.create({
      username: 'logoutuser',
      email: 'logout@example.com',
      password,
      fullName: { firstName: 'Logout', lastName: 'User' }
    });

    token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    authCookie = `tokenOfUser=${token}`;
  });

  it('should logout successfully and blacklist token when token cookie is present', async () => {
    const response = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/logged out/i);

    // redis.set should be called with the blacklist key for the token
    expect(redis.set).toHaveBeenCalledWith(`blacklist:${token}`, 'true', 'EX', 20 * 60 * 60);

    // cookie cleared for name 'token' as implemented
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toMatch(/token=/);
  });

  it('should still return 200 and not call redis when cookie is missing', async () => {
    const response = await request(app).get('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/logged out/i);
    expect(redis.set).not.toHaveBeenCalled();

    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toMatch(/token=/);
  });
});
