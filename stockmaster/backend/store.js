// Simple in-memory datastore for demo purposes only

let nextId = 1;
const genId = () => String(nextId++);

const users = [];
const otps = []; // { userId, code, expiresAt }

const products = [];
const warehouses = [];
const locations = [];

const receipts = [];
const deliveries = [];
const transfers = [];
const adjustments = [];

const stockLevels = []; // { id, productId, locationId, quantity }
const stockMoves = []; // { id, productId, fromLocationId, toLocationId, quantity, documentType, documentId, createdAt }

function findStockLevel(productId, locationId) {
  let level = stockLevels.find(s => s.productId === productId && s.locationId === locationId);
  if (!level) {
    level = { id: genId(), productId, locationId, quantity: 0 };
    stockLevels.push(level);
  }
  return level;
}

function adjustStock(productId, fromLocationId, toLocationId, quantity, documentType, documentId) {
  if (!productId || !quantity || quantity <= 0) {
    throw new Error('Invalid stock adjustment');
  }
  if (fromLocationId) {
    const from = findStockLevel(productId, fromLocationId);
    if (from.quantity < quantity) {
      throw new Error('Insufficient stock');
    }
    from.quantity -= quantity;
  }
  if (toLocationId) {
    const to = findStockLevel(productId, toLocationId);
    to.quantity += quantity;
  }
  stockMoves.push({
    id: genId(),
    productId,
    fromLocationId: fromLocationId || null,
    toLocationId: toLocationId || null,
    quantity,
    documentType,
    documentId,
    createdAt: new Date().toISOString()
  });
}

function createUser({ name, email, passwordHash }) {
  const user = { id: genId(), name, email, passwordHash };
  users.push(user);
  return user;
}

function createOtpForUser(userId) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otps.push({ userId, code, expiresAt, used: false });
  return code;
}

function verifyOtp(userId, code) {
  const now = Date.now();
  const record = otps.find(o => o.userId === userId && o.code === code && !o.used && o.expiresAt >= now);
  if (!record) return false;
  record.used = true;
  return true;
}

// Seed a default warehouse and locations
(function seed() {
  const whId = genId();
  warehouses.push({ id: whId, name: 'Main Warehouse', code: 'MAIN' });
  const locMain = { id: genId(), warehouseId: whId, name: 'Main Store', code: 'MAIN-STORE' };
  const locProd = { id: genId(), warehouseId: whId, name: 'Production Rack', code: 'PROD-RACK' };
  locations.push(locMain, locProd);
})();

module.exports = {
  users,
  otps,
  products,
  warehouses,
  locations,
  receipts,
  deliveries,
  transfers,
  adjustments,
  stockLevels,
  stockMoves,
  findStockLevel,
  adjustStock,
  createUser,
  createOtpForUser,
  verifyOtp,
  genId
};