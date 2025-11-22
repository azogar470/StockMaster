const express = require('express');

module.exports = function(store) {
  const router = express.Router();

  router.get('/summary', (req, res) => {
    // Total products in stock (distinct products with qty > 0)
    const productIdsWithStock = new Set(
      store.stockLevels.filter(sl => sl.quantity > 0).map(sl => sl.productId)
    );
    const totalProductsInStock = productIdsWithStock.size;

    // Low stock / out of stock
    const lowStock = [];
    const outOfStock = [];
    store.products.forEach(p => {
      const totalQty = store.stockLevels
        .filter(sl => sl.productId === p.id)
        .reduce((sum, sl) => sum + sl.quantity, 0);
      if (totalQty === 0) {
        outOfStock.push({ product: p, totalQty });
      } else if (p.reorderLevel && totalQty <= p.reorderLevel) {
        lowStock.push({ product: p, totalQty });
      }
    });

    const pendingReceipts = store.receipts.filter(r => r.status !== 'DONE' && r.status !== 'CANCELED').length;
    const pendingDeliveries = store.deliveries.filter(d => d.status !== 'DONE' && d.status !== 'CANCELED').length;
    const pendingTransfers = store.transfers.filter(t => t.status !== 'DONE' && t.status !== 'CANCELED').length;

    res.json({
      totalProductsInStock,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      lowStock,
      outOfStock
    });
  });

  return router;
};