const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

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

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        fullName: { firstName: 'Test', lastName: 'User' },
        role: 'buyer',
        address: {
          street: '123 Main St',
          city: 'Testville',
          state: 'TS',
          zip: '00000',
          country: 'Testland'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.password).toBeUndefined();
  });

  it('should reject registration if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Missing required fields/);
  });

  it('should prevent duplicate registration', async () => {
    await User.create({
      username: 'duplicate',
      email: 'duplicate@example.com',
      password: 'irrelevant',
      fullName: { firstName: 'Dupe', lastName: 'User' }
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'duplicate',
        email: 'duplicate@example.com',
        password: 'Password123!',
        fullName: { firstName: 'Dupe', lastName: 'User' }
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/Username or Email already exists/);
  });
});
