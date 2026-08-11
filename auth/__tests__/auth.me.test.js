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

describe('GET /api/auth/me', () => {
  it("returns the authenticated user's profile", async () => {
    const unique = Date.now();

    const payload = {
      username: `meuser_${unique}`,
      email: `me_${unique}@example.com`,
      password: 'Password123',
      fullName: {
        firstName: 'Me',
        lastName: 'User',
      },
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(payload.email);
    expect(res.body.user.username).toBe(payload.username);
    expect(res.body.user.fullName).toMatchObject(payload.fullName);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['tokenOfUser=invalid']);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 when the user from the token no longer exists', async () => {
    const unique = Date.now();

    const payload = {
      username: `deleted_${unique}`,
      email: `deleted_${unique}@example.com`,
      password: 'Password123',
      fullName: {
        firstName: 'Deleted',
        lastName: 'User',
      },
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: payload.email,
        password: payload.password,
      });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers['set-cookie'];

    await User.deleteOne({ email: payload.email });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookies);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 when the token cookie is empty', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['tokenOfUser=']);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
