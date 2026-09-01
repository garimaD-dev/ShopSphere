const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const productModel = require('../src/models/product.model');

describe('DELETE /api/products/:id', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  function authToken(sellerId = new mongoose.Types.ObjectId().toString()) {
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
    return { token, sellerId };
  }

  it('deletes a product owned by the authenticated seller', async () => {
    const { token, sellerId } = authToken();
    const product = await productModel.create({
      title: 'Deletable Product',
      description: 'Owned by seller',
      price: { amount: 10, currency: 'INR' },
      seller: sellerId,
      images: [],
    });

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Cookie', [`tokenOfUser=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Product deleted');

    const deleted = await productModel.findById(product._id);
    expect(deleted).toBeNull();
  });

  it('returns 404 when the product does not exist', async () => {
    const { token } = authToken();
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/products/${missingId}`)
      .set('Cookie', [`tokenOfUser=${token}`]);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  it('returns 400 for invalid product id format', async () => {
    const { token } = authToken();

    const res = await request(app)
      .delete('/api/products/invalid-id')
      .set('Cookie', [`tokenOfUser=${token}`]);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid product id');
  });

  it('returns 403 when deleting a product owned by another seller', async () => {
    const { token } = authToken();
    const otherSellerId = new mongoose.Types.ObjectId().toString();
    const product = await productModel.create({
      title: 'Not Yours',
      description: 'Owned by another seller',
      price: { amount: 20, currency: 'INR' },
      seller: otherSellerId,
      images: [],
    });

    const res = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Cookie', [`tokenOfUser=${token}`]);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message', 'Forbidden: You can only delete your own products only');
  });

  it('returns 401 when auth token is missing', async () => {
    const product = await productModel.create({
      title: 'No Auth Delete',
      description: 'Requires auth',
      price: { amount: 5, currency: 'INR' },
      seller: new mongoose.Types.ObjectId(),
      images: [],
    });

    const res = await request(app)
      .delete(`/api/products/${product._id}`);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Unauthorized : No token provided');
  });
});
