const express = require('express');
const multer = require('multer');
const createAuthMiddleware = require('../middlewares/auth.middleware');
const validator = require('../middlewares/validator.middleware');
const productController = require('../controllers/product.controller');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });



//POST /api/products/
router.post(
  '/',
  createAuthMiddleware(['admin', 'seller']),
  upload.array('images', 5),
  validator.createProductValidations,
  productController.createProduct,
);

//GET /api/products/
router.get('/', productController.getProducts);


//PATCH /api/products/:id
router.patch('/:id',createAuthMiddleware(["seller"]), productController.updateProduct);

//DELETE /api/products/:id
router.delete('/:id',createAuthMiddleware(["seller"]), productController.deleteProduct);

//GET /api/products/seller
router.get('/seller',createAuthMiddleware(["seller"]), productController.getProductBySeller);

//GET /api/products/:id 
router.get('/:id', productController.getProductsById);



module.exports = router;