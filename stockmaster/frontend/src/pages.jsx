import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from './apiClient';

export function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(setSummary)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!summary) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1>Inventory Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card clickable" onClick={() => navigate('/products')}>
          Total Products in Stock: {summary.totalProductsInStock}
        </div>
        <div className="kpi-card clickable" onClick={() => navigate('/products')}>
          Low Stock Items: {summary.lowStockCount}
        </div>
        <div className="kpi-card clickable" onClick={() => navigate('/products')}>
          Out of Stock Items: {summary.outOfStockCount}
        </div>
        <div className="kpi-card clickable" onClick={() => navigate('/operations/receipts')}>
          Pending Receipts: {summary.pendingReceipts}
        </div>
        <div className="kpi-card clickable" onClick={() => navigate('/operations/deliveries')}>
          Pending Deliveries: {summary.pendingDeliveries}
        </div>
        <div className="kpi-card clickable" onClick={() => navigate('/operations/transfers')}>
          Pending Transfers: {summary.pendingTransfers}
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  async function load() {
    try {
      const list = await api.get('/products');
      setProducts(list);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/products', {
        name,
        sku,
        category,
        initialStock: initialStock ? Number(initialStock) : 0,
        reorderLevel: reorderLevel ? Number(reorderLevel) : 0,
      });
      setName('');
      setSku('');
      setCategory('');
      setInitialStock('');
      setReorderLevel('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    const matchesSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term);
    const matchesCategory = !categoryFilter || (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div>
      <h1>Products</h1>
      <form onSubmit={handleCreate} className="inline-form">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input placeholder="Initial Stock" value={initialStock} onChange={e => setInitialStock(e.target.value)} />
        <input placeholder="Reorder Level" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div className="inline-form">
        <input
          placeholder="Search by name or SKU"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Reorder Level</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td><Link to={`/products/${p.id}`}>{p.name}</Link></td>
              <td>{p.sku}</td>
              <td>{p.category || '-'}</td>
              <td>{p.reorderLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(setData)
      .catch(err => setError(err.message));
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>Loading...</div>;

  const { product, stockPerLocation, moves } = data;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>SKU: {product.sku}</p>
      <h2>Stock by Location</h2>
      <ul>
        {stockPerLocation.map(row => (
          <li key={row.locationId}>
            {row.location ? row.location.name : row.locationId}: {row.quantity}
          </li>
        ))}
      </ul>
      <h2>Recent Moves</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>From</th>
            <th>To</th>
            <th>Qty</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {moves.map(m => (
            <tr key={m.id}>
              <td>{m.createdAt}</td>
              <td>{m.fromLocationId}</td>
              <td>{m.toLocationId}</td>
              <td>{m.quantity}</td>
              <td>{m.documentType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useLocationsAndProducts() {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/warehouses').then(list => {
      const locs = list.flatMap(w => w.locations);
      setLocations(locs);
    });
    api.get('/products').then(setProducts);
  }, []);

  return { locations, products };
}

export function ReceiptsPage() {
  const { locations, products } = useLocationsAndProducts();
  const [selectedLocation, setSelectedLocation] = useState('');
  const [lines, setLines] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  async function load() {
    const r = await api.get('/operations/receipts');
    setReceipts(r);
  }

  useEffect(() => {
    load();
  }, []);

  function addLine() {
    setLines([...lines, { productId: '', receivedQty: '' }]);
  }

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  async function createReceipt(e) {
    e.preventDefault();
    setError('');
    const preparedLines = lines
      .map(l => ({ productId: l.productId, receivedQty: Number(l.receivedQty) }))
      .filter(l => l.productId && l.receivedQty > 0);
    if (!selectedLocation) {
      setError('Please select a location');
      return;
    }
    if (preparedLines.length === 0) {
      setError('Please add at least one product line with quantity');
      return;
    }
    try {
      const payload = {
        supplierName: '',
        locationId: selectedLocation,
        lines: preparedLines,
      };
      await api.post('/operations/receipts', payload);
      setLines([]);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function validateReceipt(id) {
    try {
      await api.post(`/operations/receipts/${id}/validate`, {});
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  const visibleReceipts = receipts.filter(r => {
    const matchesStatus = !statusFilter ||
      (statusFilter === 'PENDING' && r.status !== 'DONE' && r.status !== 'CANCELED') ||
      (statusFilter === 'DONE' && r.status === 'DONE');
    const matchesLocation = !locationFilter || r.locationId === locationFilter;
    return matchesStatus && matchesLocation;
  });

  return (
    <div>
      <h1>Receipts</h1>
      <div className="inline-form">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <form onSubmit={createReceipt} className="inline-form">
        <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
          <option value="">Select location</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" onClick={addLine}>Add Line</button>
        <button type="submit">Create Receipt</button>
      </form>
      {lines.map((line, idx) => (
        <div key={idx} className="inline-form">
          <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="Qty"
            value={line.receivedQty}
            onChange={e => updateLine(idx, 'receivedQty', e.target.value)}
          />
        </div>
      ))}
      {error && <div className="error">{error}</div>}
      <h2>Existing Receipts</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleReceipts.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.locationId}</td>
              <td>{r.status}</td>
              <td>
                {r.status !== 'DONE' && (
                  <button onClick={() => validateReceipt(r.id)}>Validate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DeliveriesPage() {
  const { locations, products } = useLocationsAndProducts();
  const [locationId, setLocationId] = useState('');
  const [lines, setLines] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  async function load() {
    const d = await api.get('/operations/deliveries');
    setDeliveries(d);
  }

  useEffect(() => {
    load();
  }, []);

  function addLine() {
    setLines([...lines, { productId: '', quantity: '' }]);
  }

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  async function createDelivery(e) {
    e.preventDefault();
    const preparedLines = lines
      .map(l => ({ productId: l.productId, quantity: Number(l.quantity) }))
      .filter(l => l.productId && l.quantity > 0);
    if (!locationId) {
      alert('Please select a source location');
      return;
    }
    if (preparedLines.length === 0) {
      alert('Please add at least one product line with quantity');
      return;
    }
    const payload = {
      customerName: '',
      locationId,
      lines: preparedLines,
    };
    await api.post('/operations/deliveries', payload);
    setLines([]);
    await load();
  }

  async function validateDelivery(id) {
    await api.post(`/operations/deliveries/${id}/validate`, {});
    await load();
  }

  const visibleDeliveries = deliveries.filter(d => {
    const matchesStatus = !statusFilter ||
      (statusFilter === 'PENDING' && d.status !== 'DONE' && d.status !== 'CANCELED') ||
      (statusFilter === 'DONE' && d.status === 'DONE');
    const matchesLocation = !locationFilter || d.locationId === locationFilter;
    return matchesStatus && matchesLocation;
  });

  return (
    <div>
      <h1>Delivery Orders</h1>
      <div className="inline-form">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <form onSubmit={createDelivery} className="inline-form">
        <select value={locationId} onChange={e => setLocationId(e.target.value)}>
          <option value="">Source location</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" onClick={addLine}>Add Line</button>
        <button type="submit">Create Delivery</button>
      </form>
      {lines.map((line, idx) => (
        <div key={idx} className="inline-form">
          <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="Qty"
            value={line.quantity}
            onChange={e => updateLine(idx, 'quantity', e.target.value)}
          />
        </div>
      ))}
      <h2>Existing Deliveries</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleDeliveries.map(d => (
            <tr key={d.id}>
              <td>{d.id}</td>
              <td>{d.locationId}</td>
              <td>{d.status}</td>
              <td>
                {d.status !== 'DONE' && (
                  <button onClick={() => validateDelivery(d.id)}>Validate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransfersPage() {
  const { locations, products } = useLocationsAndProducts();
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [lines, setLines] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  async function load() {
    const t = await api.get('/operations/transfers');
    setTransfers(t);
  }

  useEffect(() => {
    load();
  }, []);

  function addLine() {
    setLines([...lines, { productId: '', quantity: '' }]);
  }

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  async function createTransfer(e) {
    e.preventDefault();
    const preparedLines = lines
      .map(l => ({ productId: l.productId, quantity: Number(l.quantity) }))
      .filter(l => l.productId && l.quantity > 0);
    if (!fromLocationId || !toLocationId) {
      alert('Please select both source and destination locations');
      return;
    }
    if (fromLocationId === toLocationId) {
      alert('Source and destination must be different');
      return;
    }
    if (preparedLines.length === 0) {
      alert('Please add at least one product line with quantity');
      return;
    }
    const payload = {
      fromLocationId,
      toLocationId,
      lines: preparedLines,
    };
    await api.post('/operations/transfers', payload);
    setLines([]);
    await load();
  }

  async function validateTransfer(id) {
    await api.post(`/operations/transfers/${id}/validate`, {});
    await load();
  }

  const visibleTransfers = transfers.filter(t => {
    const matchesStatus = !statusFilter ||
      (statusFilter === 'PENDING' && t.status !== 'DONE' && t.status !== 'CANCELED') ||
      (statusFilter === 'DONE' && t.status === 'DONE');
    const matchesLocation = !locationFilter || t.fromLocationId === locationFilter || t.toLocationId === locationFilter;
    return matchesStatus && matchesLocation;
  });

  return (
    <div>
      <h1>Internal Transfers</h1>
      <div className="inline-form">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <form onSubmit={createTransfer} className="inline-form">
        <select value={fromLocationId} onChange={e => setFromLocationId(e.target.value)}>
          <option value="">From</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select value={toLocationId} onChange={e => setToLocationId(e.target.value)}>
          <option value="">To</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" onClick={addLine}>Add Line</button>
        <button type="submit">Create Transfer</button>
      </form>
      {lines.map((line, idx) => (
        <div key={idx} className="inline-form">
          <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="Qty"
            value={line.quantity}
            onChange={e => updateLine(idx, 'quantity', e.target.value)}
          />
        </div>
      ))}
      <h2>Existing Transfers</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleTransfers.map(t => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.fromLocationId}</td>
              <td>{t.toLocationId}</td>
              <td>{t.status}</td>
              <td>
                {t.status !== 'DONE' && (
                  <button onClick={() => validateTransfer(t.id)}>Validate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdjustmentsPage() {
  const { locations, products } = useLocationsAndProducts();
  const [locationId, setLocationId] = useState('');
  const [lines, setLines] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  async function load() {
    const a = await api.get('/operations/adjustments');
    setAdjustments(a);
  }

  useEffect(() => {
    load();
  }, []);

  function addLine() {
    setLines([...lines, { productId: '', countedQuantity: '' }]);
  }

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  async function createAdjustment(e) {
    e.preventDefault();
    const preparedLines = lines
      .map(l => ({ productId: l.productId, countedQuantity: Number(l.countedQuantity) }))
      .filter(l => l.productId && !Number.isNaN(l.countedQuantity));
    if (!locationId) {
      alert('Please select a location');
      return;
    }
    if (preparedLines.length === 0) {
      alert('Please add at least one product line with counted quantity');
      return;
    }
    const payload = {
      locationId,
      reason: 'MANUAL',
      lines: preparedLines,
    };
    await api.post('/operations/adjustments', payload);
    setLines([]);
    await load();
  }

  async function validateAdjustment(id) {
    await api.post(`/operations/adjustments/${id}/validate`, {});
    await load();
  }

  const visibleAdjustments = adjustments.filter(a => {
    const matchesStatus = !statusFilter ||
      (statusFilter === 'PENDING' && a.status !== 'DONE' && a.status !== 'CANCELED') ||
      (statusFilter === 'DONE' && a.status === 'DONE');
    const matchesLocation = !locationFilter || a.locationId === locationFilter;
    return matchesStatus && matchesLocation;
  });

  return (
    <div>
      <h1>Stock Adjustments</h1>
      <div className="inline-form">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DONE">Done</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <form onSubmit={createAdjustment} className="inline-form">
        <select value={locationId} onChange={e => setLocationId(e.target.value)}>
          <option value="">Location</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="button" onClick={addLine}>Add Line</button>
        <button type="submit">Create Adjustment</button>
      </form>
      {lines.map((line, idx) => (
        <div key={idx} className="inline-form">
          <select value={line.productId} onChange={e => updateLine(idx, 'productId', e.target.value)}>
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="Counted Qty"
            value={line.countedQuantity}
            onChange={e => updateLine(idx, 'countedQuantity', e.target.value)}
          />
        </div>
      ))}
      <h2>Existing Adjustments</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleAdjustments.map(a => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{a.locationId}</td>
              <td>{a.status}</td>
              <td>
                {a.status !== 'DONE' && (
                  <button onClick={() => validateAdjustment(a.id)}>Validate</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MovesPage() {
  const [moves, setMoves] = useState([]);
  const { locations, products } = useLocationsAndProducts();
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    api.get('/operations/moves').then(setMoves);
  }, []);

  const filteredMoves = moves.filter(m => {
    const matchesDocType = !documentTypeFilter || m.documentType === documentTypeFilter;
    const matchesProduct = !productFilter || m.productId === productFilter;
    const matchesLocation =
      !locationFilter ||
      m.fromLocationId === locationFilter ||
      m.toLocationId === locationFilter;
    return matchesDocType && matchesProduct && matchesLocation;
  });

  function productName(id) {
    const p = products.find(p => p.id === id);
    return p ? p.name : id;
  }

  function locationName(id) {
    const l = locations.find(l => l.id === id);
    return l ? l.name : id;
  }

  return (
    <div>
      <h1>Stock Move History</h1>
      <div className="inline-form">
        <select
          value={documentTypeFilter}
          onChange={e => setDocumentTypeFilter(e.target.value)}
        >
          <option value="">All document types</option>
          <option value="RECEIPT">Receipts</option>
          <option value="DELIVERY">Delivery Orders</option>
          <option value="TRANSFER">Internal Transfers</option>
          <option value="ADJUSTMENT">Adjustments</option>
          <option value="INITIAL">Initial Stock</option>
        </select>
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
        >
          <option value="">All products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
        >
          <option value="">All locations</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>From</th>
            <th>To</th>
            <th>Qty</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredMoves.map(m => (
            <tr key={m.id}>
              <td>{m.createdAt}</td>
              <td>{productName(m.productId)}</td>
              <td>{m.fromLocationId ? locationName(m.fromLocationId) : '-'}</td>
              <td>{m.toLocationId ? locationName(m.toLocationId) : '-'}</td>
              <td>{m.quantity}</td>
              <td>{m.documentType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  async function load() {
    const w = await api.get('/warehouses');
    setWarehouses(w);
  }

  useEffect(() => {
    load();
  }, []);

  async function createWarehouse(e) {
    e.preventDefault();
    await api.post('/warehouses', { name, code });
    setName('');
    setCode('');
    await load();
  }

  return (
    <div>
      <h1>Warehouses & Locations</h1>
      <form onSubmit={createWarehouse} className="inline-form">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Code" value={code} onChange={e => setCode(e.target.value)} />
        <button type="submit">Add Warehouse</button>
      </form>
      <div>
        {warehouses.map(w => (
          <div key={w.id} className="card">
            <h3>{w.name} ({w.code})</h3>
            <ul>
              {w.locations.map(l => (
                <li key={l.id}>{l.name} ({l.code})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilePage() {
  return (
    <div>
      <h1>My Profile</h1>
      <p>Basic profile placeholder.</p>
    </div>
  );
}
