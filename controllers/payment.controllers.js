const axios = require('axios');
const Payment = require('../models/payment.model');

exports.initiatePayment = async (req, res) => {
  try {
    const { amount, email, name, phone_number } = req.body;
    const tx_ref = 'MC-' + Date.now();
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: 'http://localhost:5173/payment-callback',
        customer: { email, name, phonenumber: phone_number },
        customizations: {
          title: 'Simple Ecommerce',
          description: 'Payment for items in cart',
          logo: 'https://flutterwave.com/images/logo-colored.svg',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await Payment.create({
      tx_ref,
      amount,
      currency: 'NGN',
      email,
      name,
      phone_number,
      payment_link: response.data.data.link,
      payment_response: response.data,
      status: 'pending',
    });

    res.json({ link: response.data.data.link });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
};

exports.paymentCallback = async (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;
  try {
    if (status === 'successful') {
      const verifyRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const payment = await Payment.findOne({ tx_ref });
      if (
        verifyRes.data.data.status === 'successful' &&
        payment &&
        verifyRes.data.data.amount === payment.amount &&
        verifyRes.data.data.currency === payment.currency
      ) {
        payment.status = 'successful';
        payment.payment_response = verifyRes.data;
        await payment.save();
        return res.redirect(`/payment-callback?status=success&tx_ref=${tx_ref}`);
      } else {
        if (payment) {
          payment.status = 'failed';
          payment.payment_response = verifyRes.data;
          await payment.save();
        }
        return res.redirect(`/payment-callback?status=failed&tx_ref=${tx_ref}`);
      }
    } else {
      await Payment.findOneAndUpdate({ tx_ref }, { status: 'failed' });
      return res.redirect(`/payment-callback?status=failed&tx_ref=${tx_ref}`);
    }
  } catch (err) {
    await Payment.findOneAndUpdate({ tx_ref }, { status: 'error' });
    return res.redirect(`/payment-callback?status=error&tx_ref=${tx_ref}`);
  }
};