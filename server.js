const express = require('express');
const cors = require('cors');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database សាកល្បង
let userWallet = {
  balance: 2.15,
  transactions: [
    { id: 'ADC-696867-0066', date: '16 May 2026', type: 'expense', amount: 1.60 },
    { id: 'ADC-696867-0065', date: '15 May 2026', type: 'expense', amount: 1.60 },
    { id: 'ADC-696867-0064', date: '15 May 2026', type: 'expense', amount: 1.60 },
    { id: 'ADC-696867-0063', date: '08 May 2026', type: 'expense', amount: 1.60 },
    { id: 'WALLET-696867-0006', date: '08 May 2026', type: 'income', amount: 6.99 },
    { id: 'ADC-696867-0062', date: '27 March 2026', type: 'expense', amount: 1.60 },
    { id: 'WALLET-696867-0005', date: '24 March 2026', type: 'income', amount: 1.99 }
  ]
};

// 1. API ទាញយកព័ត៌មាន Wallet
app.get('/api/wallet', (req, res) => {
  res.json(userWallet);
});

// 2. API បង្កើត Bakong KHQR
app.post('/api/wallet/generate-khqr', (req, res) => {
  try {
    const { amount } = req.body;
    const billNumber = 'WALLET-' + Math.floor(100000 + Math.random() * 900000);

    const individualInfo = new IndividualInfo(
      'samnang_mon@bkrt',
      'SmeyLov',
      'Phnom Penh',
      {
        currency: khqrData.currency.usd,
        amount: parseFloat(amount),
        billNumber: billNumber,
        storeLabel: 'Angkor DC',
        terminalLabel: 'Web Store'
      }
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    if (result.status.code === 0) {
      res.json({
        success: true,
        billNumber,
        amount: parseFloat(amount).toFixed(2),
        qrString: result.data.qr,
        deepLink: `bakong://qr?qr=${encodeURIComponent(result.data.qr)}`
      });
    } else {
      res.status(400).json({ success: false, message: result.status.message });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. API បញ្ជាក់ការទូទាត់ (បញ្ចូលលុយ)
app.post('/api/wallet/confirm-topup', (req, res) => {
  const { amount, billNumber } = req.body;
  const numAmount = parseFloat(amount);
  
  userWallet.balance = parseFloat((userWallet.balance + numAmount).toFixed(2));
  
  // បន្ថែមប្រវត្តិ Transaction ថ្មីនៅដើមគេ
  userWallet.transactions.unshift({
    id: billNumber,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    type: 'income',
    amount: numAmount
  });

  res.json({ success: true, balance: userWallet.balance });
});

// 4. API ទិញសំបុត្ររឿង (កាត់លុយ)
app.post('/api/wallet/purchase-movie', (req, res) => {
  const price = 1.60;
  if (userWallet.balance < price) {
    return res.status(400).json({ success: false, message: 'សមតុល្យទឹកប្រាក់មិនគ្រប់គ្រាន់' });
  }

  userWallet.balance = parseFloat((userWallet.balance - price).toFixed(2));
  const billNumber = 'ADC-' + Math.floor(100000 + Math.random() * 900000);
  
  userWallet.transactions.unshift({
    id: billNumber,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    type: 'expense',
    amount: price
  });

  res.json({ success: true, balance: userWallet.balance });
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
