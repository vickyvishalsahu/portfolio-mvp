'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FIELD_CLASS = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
const LABEL_CLASS = 'block text-xs text-gray-400 mb-1';

const NewTransactionPage = () => {
  const { t } = useTranslation('transactions');
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

    if (!form.name.trim()) { setError(t('errors.nameRequired')); return; }
    if (!form.broker.trim()) { setError(t('errors.brokerRequired')); return; }
    if (!qty || qty <= 0) { setError(t('errors.quantityInvalid')); return; }
    if (!price || price <= 0) { setError(t('errors.priceInvalid')); return; }
    if (!form.transaction_date) { setError(t('errors.dateRequired')); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: qty, price }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('errors.generic'));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <div className="bg-green-950 border border-green-800 rounded-lg p-6 mb-6">
          <p className="text-green-400 font-medium">{t('success')}</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { setSuccess(false); setForm((prevForm) => ({ ...prevForm, ticker: '', name: '', quantity: '', price: '' })); }}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            {t('actions.addAnother')}
          </button>
          <a href="/holdings" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition">
            {t('actions.viewHoldings')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('fields.assetType')}</label>
            <select className={FIELD_CLASS} value={form.asset_type} onChange={(event) => set('asset_type', event.target.value)}>
              <option value="stock">{t('assetTypes.stock')}</option>
              <option value="etf">{t('assetTypes.etf')}</option>
              <option value="mf">{t('assetTypes.mf')}</option>
              <option value="crypto">{t('assetTypes.crypto')}</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('fields.transactionType')}</label>
            <select className={FIELD_CLASS} value={form.transaction_type} onChange={(event) => set('transaction_type', event.target.value)}>
              <option value="buy">{t('transactionTypes.buy')}</option>
              <option value="sell">{t('transactionTypes.sell')}</option>
              <option value="sip">{t('transactionTypes.sip')}</option>
              <option value="dividend">{t('transactionTypes.dividend')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('fields.name')} <span className="text-gray-600">{t('required')}</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder={t('placeholders.name')}
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('fields.ticker')} <span className="text-gray-600">{t('optional')}</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder={t('placeholders.ticker')}
            value={form.ticker}
            onChange={(event) => set('ticker', event.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('fields.quantity')}</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder={t('placeholders.quantity')}
              value={form.quantity}
              onChange={(event) => set('quantity', event.target.value)}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('fields.pricePerUnit')}</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder={t('placeholders.price')}
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('fields.currency')}</label>
            <select className={FIELD_CLASS} value={form.currency} onChange={(event) => set('currency', event.target.value)}>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('fields.date')}</label>
            <input
              className={FIELD_CLASS}
              type="date"
              value={form.transaction_date}
              onChange={(event) => set('transaction_date', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('fields.broker')}</label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder={t('placeholders.broker')}
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
          {submitting ? t('actions.saving') : t('actions.submit')}
        </button>
      </form>
    </div>
  );
};

export default NewTransactionPage;
