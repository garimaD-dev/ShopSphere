const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const bcrypt = require('bcryptjs');

beforeAll(async () => {
  await require('../test/setup')();
});

afterAll(async () => {
  await mongoose.disconnect();
  await global.__MONGOSERVER__.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const password = 'Password123!';
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username: 'loginuser',
      email: 'login@example.com',
      password: hashed,
      fullName: { firstName: 'Login', lastName: 'User' }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('login@example.com');
  });

  it('should reject login with wrong password', async () => {
    const password = 'Password123!';
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username: 'loginuser2',
      email: 'login2@example.com',
      password: hashed,
      fullName: { firstName: 'Login', lastName: 'User2' }
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login2@example.com',
        password: 'WrongPassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  it('should reject login for unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });
});
