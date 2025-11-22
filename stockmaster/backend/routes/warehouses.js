const express = require('express');

module.exports = function(store) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const warehouses = store.warehouses.map(w => ({
      ...w,
      locations: store.locations.filter(l => l.warehouseId === w.id)
    }));
    res.json(warehouses);
  });

  router.post('/', (req, res) => {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    const existing = store.warehouses.find(w => w.code === code);
    if (existing) return res.status(400).json({ message: 'Warehouse code already exists' });
    const wh = { id: store.genId(), name, code };
    store.warehouses.push(wh);
    res.status(201).json(wh);
  });

  router.post('/:warehouseId/locations', (req, res) => {
    const { warehouseId } = req.params;
    const wh = store.warehouses.find(w => w.id === warehouseId);
    if (!wh) return res.status(404).json({ message: 'Warehouse not found' });
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const existing = store.locations.find(l => l.code === code);
    if (existing) return res.status(400).json({ message: 'Location code already exists' });
    const loc = { id: store.genId(), warehouseId, name, code };
    store.locations.push(loc);
    res.status(201).json(loc);
  });

  return router;
};