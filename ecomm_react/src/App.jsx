import { useState } from 'react';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);
  const [product, setProduct] = useState({ name: '', price: '' });
  const [customer, setCustomer] = useState({ name: '', email: '', phone_number: '' });
  const [message, setMessage] = useState('');

  // Add product to cart
  const addToCart = () => {
    if (!product.name || !product.price) return;
    setCart([...cart, { ...product, price: parseFloat(product.price) }]);
    setProduct({ name: '', price: '' });
  };

  // Handle customer input
  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  // Handle payment
  const handlePay = async (e) => {
    e.preventDefault();
    setMessage('');
    const amount = cart.reduce((sum, item) => sum + item.price, 0);
    if (!customer.name || !customer.email || !customer.phone_number || amount <= 0) {
      setMessage('Fill all details and add items to cart.');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customer, amount }),
      });
      const data = await res.json();
      if (data.link) {
        window.location.href = data.link; // Redirect to Flutterwave payment page
      } else {
        setMessage('Failed to get payment link');
      }
    } catch (err) {
      console.error("frontend fetch error:",err);
      setMessage('Payment error');
    }
  };

  return (
    <div className="App" style={{ maxWidth: 500, margin: 'auto', padding: 20 }}>
      <h2>Simple Ecommerce</h2>
      {message && <div style={{ color: 'red', marginBottom: 10 }}>{message}</div>}
      <div>
        <input
          placeholder="Product name"
          value={product.name}
          onChange={e => setProduct({ ...product, name: e.target.value })}
        />
        <input
          placeholder="Price"
          type="number"
          value={product.price}
          onChange={e => setProduct({ ...product, price: e.target.value })}
        />
        <button onClick={addToCart}>Add to Cart</button>
      </div>
      <h4>Cart</h4>
      <ul>
        {cart.map((item, idx) => (
          <li key={idx}>{item.name} - ₦{item.price}</li>
        ))}
      </ul>
      <div>Total: ₦{cart.reduce((sum, item) => sum + item.price, 0)}</div>
      <form onSubmit={handlePay} style={{ marginTop: 20 }}>
        <h4>Customer Details</h4>
        <input name="name" placeholder="Full Name" value={customer.name} onChange={handleCustomerChange} required />
        <input name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} required />
        <input name="phone_number" placeholder="Phone Number" value={customer.phone_number} onChange={handleCustomerChange} required />
        <button type="submit" style={{ marginTop: 10 }}>
          Pay with Flutterwave
        </button>
      </form>
    </div>
  );
}

export default App;
