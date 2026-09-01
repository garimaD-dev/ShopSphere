const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const productModel = require('../src/models/product.model');

describe('GET /api/products', () => {
  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('returns 200 and an empty data array when no products exist', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('returns product documents in the response data array', async () => {
    const product = await productModel.create({
      title: 'Test Product',
      description: 'A sample product',
      price: { amount: 50, currency: 'INR' },
      seller: new mongoose.Types.ObjectId(),
      images: [],
    });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      title: 'Test Product',
      description: 'A sample product',
      price: { amount: 50, currency: 'INR' },
    });
    expect(res.body.data[0]).toHaveProperty('_id');
    expect(res.body.data[0]).toHaveProperty('seller');
  });

  it('applies minprice, maxprice, skip, and limit query filters', async () => {
    const products = [
      { title: 'Cheap product', description: 'Cheap', price: { amount: 10, currency: 'INR' }, seller: new mongoose.Types.ObjectId(), images: [] },
      { title: 'Mid product', description: 'Mid', price: { amount: 50, currency: 'INR' }, seller: new mongoose.Types.ObjectId(), images: [] },
      { title: 'Expensive product', description: 'Expensive', price: { amount: 100, currency: 'INR' }, seller: new mongoose.Types.ObjectId(), images: [] },
    ];

    await productModel.insertMany(products);

    const res = await request(app)
      .get('/api/products')
      .query({ minprice: 20, maxprice: 100, skip: 1, limit: 1 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Expensive product');
  });
});
