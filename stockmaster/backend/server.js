const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// In-memory datastore (simple, single-company demo)
const store = require('./store');
const { authenticate } = require('./util/auth')(JWT_SECRET, store);

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const existing = store.users.find(u => u.email === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = store.createUser({ name, email: email.toLowerCase(), passwordHash: hash });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = store.users.find(u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// OTP flows are mocked (OTP returned in response for demo)
app.post('/api/auth/request-otp', (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = store.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });
    const otp = store.createOtpForUser(user.id);
    // In a real system, send via email/SMS. For demo, return OTP directly.
    res.json({ message: 'OTP generated', otp });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and newPassword are required' });
    }
    const user = store.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = store.verifyOtp(user.id, otp);
    if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    res.json({ message: 'Password updated' });
  } catch (err) {
    next(err);
  }
});

// --- Protected routes ---
app.use('/api', authenticate);

app.use('/api/products', require('./routes/products')(store));
app.use('/api/warehouses', require('./routes/warehouses')(store));
app.use('/api/operations', require('./routes/operations')(store));
app.use('/api/dashboard', require('./routes/dashboard')(store));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`StockMaster backend listening on port ${PORT}`);
});
