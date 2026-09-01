const request = require('supertest');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('POST /api/products', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('rejects invalid product payloads with 400', async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Missing title and price' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Missing required fields');
    expect(res.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ msg: 'Title is required' }),
      expect.objectContaining({ msg: 'Price amount is required' }),
    ]));
  });

  it('uploads an image and returns 201 with result', async () => {
    const sellerId = new mongoose.Types.ObjectId().toString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Sample product')
      .field('description', 'Test description')
      .field('priceAmount', '10')
      .field('priceCurrency', 'INR')
      .attach('images', path.join(__dirname, 'fixtures', 'sample.jpg'));

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Product Created');
    expect(res.body).toHaveProperty('data');
  });
});
