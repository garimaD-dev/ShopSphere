const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const productModel = require('../src/models/product.model');

describe('GET /api/products/:id', () => {
  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  it('returns 200 and the product when found', async () => {
    const created = await productModel.create({
      title: 'Find me',
      description: 'Findable product',
      price: { amount: 25, currency: 'INR' },
      seller: new mongoose.Types.ObjectId(),
      images: [],
    });

    const res = await request(app).get(`/api/products/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('_id', created._id.toString());
    expect(res.body.data.title).toBe('Find me');
  });

  it('returns 404 when product does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/products/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  it('returns 400 for invalid id format', async () => {
    const res = await request(app).get('/api/products/invalid-id');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid product id');
  });
});
