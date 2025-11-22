const express = require('express');

module.exports = function(store) {
  const router = express.Router();

  // Status values: DRAFT, WAITING, READY, DONE, CANCELED

  // Helper to find by ID in array
  function findById(arr, id, label, res) {
    const found = arr.find(x => x.id === id);
    if (!found) {
      res.status(404).json({ message: `${label} not found` });
      return null;
    }
    return found;
  }

  // Receipts
  router.get('/receipts', (req, res) => {
    res.json(store.receipts);
  });

  router.post('/receipts', (req, res) => {
    const { supplierName, locationId, lines } = req.body;
    if (!locationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'locationId and lines are required' });
    }
    const receipt = {
      id: store.genId(),
      supplierName: supplierName || '',
      locationId,
      status: 'READY',
      lines: lines.map(l => ({
        id: store.genId(),
        productId: l.productId,
        receivedQty: Number(l.receivedQty) || 0
      }))
    };
    store.receipts.push(receipt);
    res.status(201).json(receipt);
  });

  router.post('/receipts/:id/validate', (req, res) => {
    const receipt = findById(store.receipts, req.params.id, 'Receipt', res);
    if (!receipt) return;
    if (receipt.status === 'DONE') {
      return res.status(400).json({ message: 'Receipt already validated' });
    }
    try {
      receipt.lines.forEach(line => {
        if (line.receivedQty > 0) {
          store.adjustStock(line.productId, null, receipt.locationId, line.receivedQty, 'RECEIPT', receipt.id);
        }
      });
      receipt.status = 'DONE';
      res.json(receipt);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Deliveries
  router.get('/deliveries', (req, res) => {
    res.json(store.deliveries);
  });

  router.post('/deliveries', (req, res) => {
    const { customerName, locationId, lines } = req.body;
    if (!locationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'locationId and lines are required' });
    }
    const delivery = {
      id: store.genId(),
      customerName: customerName || '',
      locationId,
      status: 'READY',
      lines: lines.map(l => ({
        id: store.genId(),
        productId: l.productId,
        quantity: Number(l.quantity) || 0
      }))
    };
    store.deliveries.push(delivery);
    res.status(201).json(delivery);
  });

  router.post('/deliveries/:id/validate', (req, res) => {
    const delivery = findById(store.deliveries, req.params.id, 'Delivery', res);
    if (!delivery) return;
    if (delivery.status === 'DONE') {
      return res.status(400).json({ message: 'Delivery already validated' });
    }
    try {
      delivery.lines.forEach(line => {
        if (line.quantity > 0) {
          store.adjustStock(line.productId, delivery.locationId, null, line.quantity, 'DELIVERY', delivery.id);
        }
      });
      delivery.status = 'DONE';
      res.json(delivery);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Internal transfers
  router.get('/transfers', (req, res) => {
    res.json(store.transfers);
  });

  router.post('/transfers', (req, res) => {
    const { fromLocationId, toLocationId, lines } = req.body;
    if (!fromLocationId || !toLocationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'fromLocationId, toLocationId and lines are required' });
    }
    const transfer = {
      id: store.genId(),
      fromLocationId,
      toLocationId,
      status: 'READY',
      lines: lines.map(l => ({
        id: store.genId(),
        productId: l.productId,
        quantity: Number(l.quantity) || 0
      }))
    };
    store.transfers.push(transfer);
    res.status(201).json(transfer);
  });

  router.post('/transfers/:id/validate', (req, res) => {
    const transfer = findById(store.transfers, req.params.id, 'Transfer', res);
    if (!transfer) return;
    if (transfer.status === 'DONE') {
      return res.status(400).json({ message: 'Transfer already validated' });
    }
    try {
      transfer.lines.forEach(line => {
        if (line.quantity > 0) {
          store.adjustStock(line.productId, transfer.fromLocationId, transfer.toLocationId, line.quantity, 'TRANSFER', transfer.id);
        }
      });
      transfer.status = 'DONE';
      res.json(transfer);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Adjustments
  router.get('/adjustments', (req, res) => {
    res.json(store.adjustments);
  });

  router.post('/adjustments', (req, res) => {
    const { locationId, reason, lines } = req.body;
    if (!locationId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: 'locationId and lines are required' });
    }
    const adjustment = {
      id: store.genId(),
      locationId,
      reason: reason || '',
      status: 'READY',
      lines: lines.map(l => ({
        id: store.genId(),
        productId: l.productId,
        countedQuantity: Number(l.countedQuantity)
      }))
    };
    store.adjustments.push(adjustment);
    res.status(201).json(adjustment);
  });

  router.post('/adjustments/:id/validate', (req, res) => {
    const adjustment = findById(store.adjustments, req.params.id, 'Adjustment', res);
    if (!adjustment) return;
    if (adjustment.status === 'DONE') {
      return res.status(400).json({ message: 'Adjustment already validated' });
    }
    try {
      adjustment.lines.forEach(line => {
        const level = store.findStockLevel(line.productId, adjustment.locationId);
        const systemQty = level.quantity;
        const counted = line.countedQuantity;
        const diff = counted - systemQty;
        if (diff > 0) {
          store.adjustStock(line.productId, null, adjustment.locationId, diff, 'ADJUSTMENT', adjustment.id);
        } else if (diff < 0) {
          store.adjustStock(line.productId, adjustment.locationId, null, -diff, 'ADJUSTMENT', adjustment.id);
        }
      });
      adjustment.status = 'DONE';
      res.json(adjustment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // Move history
  router.get('/moves', (req, res) => {
    const { productId, locationId, documentType } = req.query;
    let moves = store.stockMoves;
    if (productId) moves = moves.filter(m => m.productId === productId);
    if (locationId) moves = moves.filter(m => m.fromLocationId === locationId || m.toLocationId === locationId);
    if (documentType) moves = moves.filter(m => m.documentType === documentType);
    moves = moves.slice().reverse();
    res.json(moves);
  });

  return router;
};