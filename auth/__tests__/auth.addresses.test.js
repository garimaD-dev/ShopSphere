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

describe('POST /api/auth/users/me/addresses', () => {
  it('adds an address for the authenticated user', async () => {
    const unique = Date.now();
    const payload = {
      username: `addruser_${unique}`,
      email: `addr_${unique}@example.com`,
      password: 'Password123',
      fullName: { firstName: 'Addr', lastName: 'User' }
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];

    const address = {
      street: '123 Test St',
      city: 'Testville',
      state: 'TS',
      pincode: '123456',
      country: 'Testland',
      isDefault: true
    };

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', cookies)
      .send(address);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');

    const user = await User.findOne({ email: payload.email }).lean();
    expect(user).toBeTruthy();
    expect(Array.isArray(user.addresses)).toBe(true);
    expect(user.addresses.length).toBeGreaterThan(0);
    const last = user.addresses[user.addresses.length - 1];
    expect(last.street).toBe(address.street);
    expect(last.city).toBe(address.city);
    expect(last.state).toBe(address.state);
    expect(last.pincode).toBe(address.pincode);
    expect(last.country).toBe(address.country);
  });

  it('returns 400 when required fields are missing', async () => {
    const unique = Date.now();
    const payload = {
      username: `addruser2_${unique}`,
      email: `addr2_${unique}@example.com`,
      password: 'Password123',
      fullName: { firstName: 'Addr', lastName: 'User' }
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    const cookies = loginRes.headers['set-cookie'];

    const invalidAddress = { city: 'Nowhere' }; // missing required fields

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', cookies)
      .send(invalidAddress);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 when no auth token is provided', async () => {
    const address = {
      street: 'No Auth St',
      city: 'Nowhere',
      state: 'NA',
      pincode: '000000',
      country: 'Nowhere'
    };

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .send(address);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 for an invalid token', async () => {
    const address = {
      street: 'Bad Token St',
      city: 'Nowhere',
      state: 'NA',
      pincode: '000000',
      country: 'Nowhere'
    };

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', ['tokenOfUser=invalid'])
      .send(address);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
