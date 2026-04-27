'use client';

import { useState } from 'react';

const FIELD_CLASS = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
const LABEL_CLASS = 'block text-xs text-gray-400 mb-1';

const NewTransactionPage = () => {
  const [form, setForm] = useState({
    asset_type: 'stock',
    ticker: '',
    name: '',
    quantity: '',
    price: '',
    currency: 'EUR',
    transaction_type: 'buy',
    transaction_date: new Date().toISOString().slice(0, 10),
    broker: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const qty = Number(form.quantity);
    const price = Number(form.price);

    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.broker.trim()) { setError('Broker is required'); return; }
    if (!qty || qty <= 0) { setError('Quantity must be greater than 0'); return; }
    if (!price || price <= 0) { setError('Price must be greater than 0'); return; }
    if (!form.transaction_date) { setError('Date is required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: qty, price }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Add Transaction</h1>
        <div className="bg-green-950 border border-green-800 rounded-lg p-6 mb-6">
          <p className="text-green-400 font-medium">Transaction added successfully.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { setSuccess(false); setForm((prevForm) => ({ ...prevForm, ticker: '', name: '', quantity: '', price: '' })); }}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            Add Another
          </button>
          <a href="/holdings" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition">
            View Holdings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Add Transaction</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Asset Type</label>
            <select className={FIELD_CLASS} value={form.asset_type} onChange={(event) => set('asset_type', event.target.value)}>
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="mf">Mutual Fund</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Transaction Type</label>
            <select className={FIELD_CLASS} value={form.transaction_type} onChange={(event) => set('transaction_type', event.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="sip">SIP</option>
              <option value="dividend">Dividend</option>
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Name <span className="text-gray-600">(required)</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder="e.g. Apple Inc"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Ticker <span className="text-gray-600">(optional)</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder="e.g. AAPL"
            value={form.ticker}
            onChange={(event) => set('ticker', event.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Quantity</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={form.quantity}
              onChange={(event) => set('quantity', event.target.value)}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Price per unit</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Currency</label>
            <select className={FIELD_CLASS} value={form.currency} onChange={(event) => set('currency', event.target.value)}>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Date</label>
            <input
              className={FIELD_CLASS}
              type="date"
              value={form.transaction_date}
              onChange={(event) => set('transaction_date', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Broker</label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder="e.g. scalable, zerodha"
            value={form.broker}
            onChange={(event) => set('broker', event.target.value)}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded transition"
        >
          {submitting ? 'Saving...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default NewTransactionPage;
