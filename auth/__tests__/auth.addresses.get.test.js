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

describe('GET /api/auth/users/me/addresses', () => {
  it('returns user addresses after adding one (authenticated)', async () => {
    const unique = Date.now();
    const payload = {
      username: `addrget_${unique}`,
      email: `addrget_${unique}@example.com`,
      password: 'Password123',
      fullName: { firstName: 'Addr', lastName: 'Get' }
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];

    const address = {
      street: '45 Example Rd',
      city: 'Citysville',
      state: 'CS',
      pincode: '555555',
      country: 'Examplestan',
      isDefault: true
    };

    // add an address first
    const addRes = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', cookies)
      .send(address);

    expect([200,201]).toContain(addRes.status);

    const res = await request(app)
      .get('/api/auth/users/me/addresses')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    // addresses may be returned as array or object depending on implementation
    expect(res.body).toHaveProperty('addresses');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/users/me/addresses');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/users/me/addresses')
      .set('Cookie', ['tokenOfUser=invalid']);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
