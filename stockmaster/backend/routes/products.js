const express = require('express');

module.exports = function(store) {
  const router = express.Router();

  // List products
  router.get('/', (req, res) => {
    res.json(store.products);
  });

  // Create product (with optional initial stock on default location if provided)
  router.post('/', (req, res) => {
    const { name, sku, category, categoryId, uom, initialStock, locationId } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ message: 'Name and SKU are required' });
    }
    const existing = store.products.find(p => p.sku === sku);
    if (existing) {
      return res.status(400).json({ message: 'SKU already exists' });
    }
    const product = {
      id: store.genId(),
      name,
      sku,
      category: category || null,
      categoryId: categoryId || null,
      uom: uom || 'unit',
      reorderLevel: req.body.reorderLevel || 0,
      isActive: true
    };
    store.products.push(product);

    if (initialStock && Number(initialStock) > 0) {
      const locId = locationId || (store.locations[0] && store.locations[0].id);
      if (!locId) {
        return res.status(400).json({ message: 'No location available for initial stock' });
      }
      store.adjustStock(product.id, null, locId, Number(initialStock), 'INITIAL', null);
    }

    res.status(201).json(product);
  });

  // Update product
  router.put('/:id', (req, res) => {
    const product = store.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { name, sku, category, categoryId, uom, reorderLevel, isActive } = req.body;
    if (name !== undefined) product.name = name;
    if (sku !== undefined) product.sku = sku;
    if (category !== undefined) product.category = category;
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (uom !== undefined) product.uom = uom;
    if (reorderLevel !== undefined) product.reorderLevel = reorderLevel;
    if (isActive !== undefined) product.isActive = !!isActive;
    res.json(product);
  });

  // Product detail with stock per location and recent moves
  router.get('/:id', (req, res) => {
    const product = store.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const stockPerLocation = store.stockLevels
      .filter(sl => sl.productId === product.id)
      .map(sl => ({
        locationId: sl.locationId,
        quantity: sl.quantity,
        location: store.locations.find(l => l.id === sl.locationId) || null
      }));
    const moves = store.stockMoves
      .filter(m => m.productId === product.id)
      .slice(-50)
      .reverse();
    res.json({ product, stockPerLocation, moves });
  });

  return router;
};