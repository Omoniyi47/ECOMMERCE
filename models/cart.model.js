const mongoose = require('mongoose');

// Cart Item Schema - represents individual items in the cart
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// Instance methods
cartSchema.methods = {
  // Calculate total amount and total items
  calculateTotals() {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    this.totalItems = this.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
    
    return this;
  },

  // Add product to cart
  addProduct(productData) {
    const { productId, name, price, image, category } = productData;
    
    // Check if product already exists in cart
    const existingItem = this.items.find(item => 
      item.productId.toString() === productId.toString()
    );

    if (existingItem) {
      // If product exists, increase quantity
      existingItem.quantity += 1;
    } else {
      // If product doesn't exist, add new item
      this.items.push({
        productId,
        name,
        price,
        quantity: 1,
        image: image || '',
        category: category || ''
      });
    }

    this.calculateTotals();
    return this;
  },

  // Remove product from cart
  removeProduct(productId) {
    this.items = this.items.filter(item => 
      item.productId.toString() !== productId.toString()
    );
    this.calculateTotals();
    return this;
  },

  // Update product quantity
  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      return this.removeProduct(productId);
    }

    const item = this.items.find(item => 
      item.productId.toString() === productId.toString()
    );

    if (item) {
      item.quantity = quantity;
      this.calculateTotals();
    }

    return this;
  },

  // Increase product quantity by 1
  increaseQuantity(productId) {
    const item = this.items.find(item => 
      item.productId.toString() === productId.toString()
    );

    if (item) {
      item.quantity += 1;
      this.calculateTotals();
    }

    return this;
  },

  // Decrease product quantity by 1
  decreaseQuantity(productId) {
    const item = this.items.find(item => 
      item.productId.toString() === productId.toString()
    );

    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        // Remove item if quantity becomes 0 or negative
        return this.removeProduct(productId);
      }
      this.calculateTotals();
    }

    return this;
  },

  // Clear entire cart
  clearCart() {
    this.items = [];
    this.totalAmount = 0;
    this.totalItems = 0;
    return this;
  },

  // Get all products in cart
  getCartItems() {
    return this.items;
  },

  // Check if cart is empty
  isEmpty() {
    return this.items.length === 0;
  },

  // Get cart summary
  getCartSummary() {
    return {
      totalItems: this.totalItems,
      totalAmount: this.totalAmount,
      itemCount: this.items.length,
      isEmpty: this.isEmpty()
    };
  }
};

// Static methods
cartSchema.statics = {
  // Find cart by user ID
  async findByUserId(userId) {
    return await this.findOne({ userId }).populate('items.productId');
  },

  // Create or get cart for user
  async getOrCreateCart(userId) {
    let cart = await this.findOne({ userId });
    
    if (!cart) {
      cart = new this({
        userId,
        items: [],
        totalAmount: 0,
        totalItems: 0
      });
      await cart.save();
    }
    
    return cart;
  },

  // Add product to user's cart
  async addProductToCart(userId, productData) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.addProduct(productData);
      return await cart.save();
    } catch (error) {
      console.error('Error in addProductToCart:', error);
      throw error;
    }
  },

  // Remove product from user's cart
  async removeProductFromCart(userId, productId) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.removeProduct(productId);
      return await cart.save();
    } catch (error) {
      console.error('Error in removeProductFromCart:', error);
      throw error;
    }
  },

  // Update product quantity in user's cart
  async updateProductQuantity(userId, productId, quantity) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.updateQuantity(productId, quantity);
      return await cart.save();
    } catch (error) {
      console.error('Error in updateProductQuantity:', error);
      throw error;
    }
  },

  // Increase product quantity in user's cart
  async increaseProductQuantity(userId, productId) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.increaseQuantity(productId);
      return await cart.save();
    } catch (error) {
      console.error('Error in increaseProductQuantity:', error);
      throw error;
    }
  },

  // Decrease product quantity in user's cart
  async decreaseProductQuantity(userId, productId) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.decreaseQuantity(productId);
      return await cart.save();
    } catch (error) {
      console.error('Error in decreaseProductQuantity:', error);
      throw error;
    }
  },

  // Clear user's cart
  async clearUserCart(userId) {
    try {
      const cart = await this.getOrCreateCart(userId);
      cart.clearCart();
      return await cart.save();
    } catch (error) {
      console.error('Error in clearUserCart:', error);
      throw error;
    }
  },

  // Get user's cart with populated product details
  async getUserCart(userId) {
    try {
      return await this.findOne({ userId })
        .populate('items.productId')
        .exec();
    } catch (error) {
      console.error('Error in getUserCart:', error);
      throw error;
    }
  }
};

// Virtual for formatted total amount
cartSchema.virtual('formattedTotal').get(function() {
  return `$${this.totalAmount.toFixed(2)}`;
});

// Ensure virtuals are included when converting to JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
