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

describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
  it('deletes an existing address for the authenticated user', async () => {
    const unique = Date.now();
    const payload = {
      username: `deleteuser_${unique}`,
      email: `delete_${unique}@example.com`,
      password: 'Password123',
      fullName: { firstName: 'Delete', lastName: 'User' }
    };

    await request(app).post('/api/auth/register').send(payload);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers['set-cookie'];

    const address = {
      street: '123 Delete St',
      city: 'Removetown',
      state: 'DL',
      pincode: '123456',
      country: 'Testland',
      isDefault: false
    };

    const addRes = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', cookies)
      .send(address);

    expect(addRes.status).toBe(201);

    const user = await User.findOne({ email: payload.email });
    expect(user).toBeTruthy();
    expect(user.addresses.length).toBe(1);
    const addressId = user.addresses[0]._id.toString();

    const deleteRes = await request(app)
      .delete(`/api/auth/users/me/addresses/${addressId}`)
      .set('Cookie', cookies);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toHaveProperty('message', 'Address deleted successfully');
    expect(Array.isArray(deleteRes.body.addresses)).toBe(true);
    expect(deleteRes.body.addresses.some(addr => addr._id === addressId)).toBe(false);

    const updatedUser = await User.findOne({ email: payload.email });
    expect(updatedUser.addresses.length).toBe(0);
  });

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .delete('/api/auth/users/me/addresses/000000000000000000000000');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});