const express = require('express');
const router = express.Router();
const Cart = require('../models/cart.model');

// POST /api/cart/create - Create a new cart for user
router.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
        data: null
      });
    }
    
    // Check if cart already exists for this user
    const existingCart = await Cart.getUserCart(userId);
    if (existingCart) {
      return res.status(409).json({
        success: false,
        message: 'Cart already exists for this user',
        data: {
          cart: existingCart,
          summary: existingCart.getCartSummary(),
          formattedTotal: existingCart.formattedTotal
        }
      });
    }
    
    // Create new cart
    const cart = await Cart.getOrCreateCart(userId);
    
    res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal,
        isEmpty: cart.isEmpty()
      }
    });
  } catch (error) {
    console.error('Error creating cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/cart/add - Add product to cart
router.post('/add', async (req, res) => {
  try {
    const { userId, productId, name, price, image, category } = req.body;
    
    // Validate required fields
    if (!userId || !productId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'userId, productId, name, and price are required',
        data: null
      });
    }
    
    const productData = {
      productId,
      name,
      price: Number(price),
      image: image || '',
      category: category || ''
    };
    
    const cart = await Cart.addProductToCart(userId, productData);
    
    res.status(201).json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/cart/:userId - Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await Cart.getUserCart(userId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal,
        isEmpty: cart.isEmpty()
      }
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/cart/:userId/quantity - Update product quantity
router.put('/:userId/quantity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;
    
    // Validate required fields
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'productId and quantity are required',
        data: null
      });
    }
    
    const cart = await Cart.updateProductQuantity(userId, productId, Number(quantity));
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product quantity updated successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error updating product quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PATCH /api/cart/:userId/increase - Increase product quantity by 1
router.patch('/:userId/increase', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    
    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required',
        data: null
      });
    }
    
    const cart = await Cart.increaseProductQuantity(userId, productId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product quantity increased successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error increasing product quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PATCH /api/cart/:userId/decrease - Decrease product quantity by 1
router.patch('/:userId/decrease', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    
    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required',
        data: null
      });
    }
    
    const cart = await Cart.decreaseProductQuantity(userId, productId);
    
    res.status(200).json({
      success: true,
      message: 'Product quantity decreased successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error decreasing product quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/cart/:userId/remove - Remove product from cart
router.delete('/:userId/remove', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    
    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId is required',
        data: null
      });
    }
    
    const cart = await Cart.removeProductFromCart(userId, productId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// DELETE /api/cart/:userId/clear - Clear entire cart
router.delete('/:userId/clear', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await Cart.clearUserCart(userId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: cart,
        summary: cart.getCartSummary(),
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/cart/:userId/items - Get only cart items
router.get('/:userId/items', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await Cart.getUserCart(userId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    const items = cart.getCartItems();
    
    res.status(200).json({
      success: true,
      message: 'Cart items retrieved successfully',
      data: {
        items: items,
        itemCount: items.length
      }
    });
  } catch (error) {
    console.error('Error getting cart items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// GET /api/cart/:userId/summary - Get cart summary only
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await Cart.getUserCart(userId);
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user',
        data: null
      });
    }
    
    const summary = cart.getCartSummary();
    
    res.status(200).json({
      success: true,
      message: 'Cart summary retrieved successfully',
      data: {
        summary: summary,
        formattedTotal: cart.formattedTotal
      }
    });
  } catch (error) {
    console.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router; 