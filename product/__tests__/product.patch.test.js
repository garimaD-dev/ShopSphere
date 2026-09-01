const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const productModel = require('../src/models/product.model');

describe('PATCH /api/products/:id', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  function authToken(role = 'seller') {
    const sellerId = new mongoose.Types.ObjectId().toString();
    return {
      token: jwt.sign({ id: sellerId, role }, process.env.JWT_SECRET),
      sellerId,
    };
  }

  it('updates title and returns 200 with updated product', async () => {
    const { token, sellerId } = authToken();
    const product = await productModel.create({
      title: 'Original Title',
      description: 'Original description',
      price: { amount: 20, currency: 'INR' },
      seller: sellerId,
      images: [],
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Cookie', [`tokenOfUser=${token}`])
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Product updated successfully');
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('updates nested price fields', async () => {
    const { token, sellerId } = authToken();
    const product = await productModel.create({
      title: 'Price Test',
      description: 'Price update test',
      price: { amount: 40, currency: 'INR' },
      seller: sellerId,
      images: [],
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Cookie', [`tokenOfUser=${token}`])
      .send({ price: { amount: 60, currency: 'USD' } });

    expect(res.status).toBe(200);
    expect(res.body.data.price.amount).toBe(60);
    expect(res.body.data.price.currency).toBe('USD');
  });

  it('returns 404 when user tries to update a product they do not own', async () => {
    const { token } = authToken();
    const product = await productModel.create({
      title: 'Owned by another',
      description: 'Unauthorized update',
      price: { amount: 35, currency: 'INR' },
      seller: new mongoose.Types.ObjectId(),
      images: [],
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Cookie', [`tokenOfUser=${token}`])
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  it('returns 400 for invalid product id', async () => {
    const { token } = authToken();

    const res = await request(app)
      .patch('/api/products/invalid-id')
      .set('Cookie', [`tokenOfUser=${token}`])
      .send({ title: 'Invalid ID' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid product id');
  });

  it('returns 401 when token is missing', async () => {
    const product = await productModel.create({
      title: 'Auth Required',
      description: 'No token',
      price: { amount: 15, currency: 'INR' },
      seller: new mongoose.Types.ObjectId(),
      images: [],
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized : No token provided');
  });
});
