'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { KNOWN_BROKERS } from '@/domains/shared/constants';

const OTHER_BROKER = '__other__';

const FIELD_CLASS = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100';
const LABEL_CLASS = 'block text-xs text-gray-500 mb-1';

const NewTransactionForm = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const emailId = searchParams.get('emailId');
  const emailSubject = searchParams.get('subject');
  const [form, setForm] = useState({
    assetType: 'stock',
    ticker: '',
    name: '',
    quantity: '',
    price: '',
    currency: 'EUR',
    transactionType: 'buy',
    transactionDate: new Date().toISOString().slice(0, 10),
    broker: '',
  });
  const [brokerSelect, setBrokerSelect] = useState(KNOWN_BROKERS[0].id);
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

    if (!form.name.trim()) {
      setError(t('transactions.errors.nameRequired'));
      return;
    }
    if (!qty || qty <= 0) {
      setError(t('transactions.errors.quantityInvalid'));
      return;
    }
    if (!price || price <= 0) {
      setError(t('transactions.errors.priceInvalid'));
      return;
    }
    if (!form.transactionDate) {
      setError(t('transactions.errors.dateRequired'));
      return;
    }

    const resolvedBroker = brokerSelect === OTHER_BROKER ? form.broker : brokerSelect;
    if (!resolvedBroker.trim()) {
      setError(t('transactions.errors.brokerRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, broker: resolvedBroker, quantity: qty, price, emailId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t('transactions.errors.generic'));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('transactions.errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSuccess = () => (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('transactions.title')}</h1>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
        <p className="text-emerald-700 font-medium">{t('transactions.success')}</p>
      </div>
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => {
            setSuccess(false);
            setForm((prevForm) => ({ ...prevForm, ticker: '', name: '', quantity: '', price: '' }));
          }}
          className="bg-slate-100 hover:bg-slate-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          {t('transactions.actions.addAnother')}
        </button>
        <a href="/holdings" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition">
          {t('transactions.actions.viewHoldings')}
        </a>
        <a href="/transactions" className="bg-slate-100 hover:bg-slate-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition">
          {t('transactions.actions.viewTransactions')}
        </a>
      </div>
    </div>
  );

  const renderFailedEmailBanner = () => {
    if (!emailId) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-amber-700 text-sm">
          {t('transactions.fromFailedEmail', { subject: emailSubject || t('transactions.title') })}
        </p>
      </div>
    );
  };

  const renderBrokerOtherInput = () => {
    if (brokerSelect !== OTHER_BROKER) return null;
    return (
      <input
        className={`${FIELD_CLASS} mt-2`}
        type="text"
        placeholder={t('transactions.placeholders.broker')}
        value={form.broker}
        onChange={(event) => set('broker', event.target.value)}
      />
    );
  };

  if (success) return renderSuccess();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('transactions.title')}</h1>
      {renderFailedEmailBanner()}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.assetType')}</label>
            <select className={FIELD_CLASS} value={form.assetType} onChange={(event) => set('assetType', event.target.value)}>
              <option value="stock">{t('transactions.assetTypes.stock')}</option>
              <option value="etf">{t('transactions.assetTypes.etf')}</option>
              <option value="mf">{t('transactions.assetTypes.mf')}</option>
              <option value="crypto">{t('transactions.assetTypes.crypto')}</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.transactionType')}</label>
            <select className={FIELD_CLASS} value={form.transactionType} onChange={(event) => set('transactionType', event.target.value)}>
              <option value="buy">{t('transactions.transactionTypes.buy')}</option>
              <option value="sell">{t('transactions.transactionTypes.sell')}</option>
              <option value="sip">{t('transactions.transactionTypes.sip')}</option>
              <option value="dividend">{t('transactions.transactionTypes.dividend')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('transactions.fields.name')} <span className="text-gray-400">{t('transactions.required')}</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder={t('transactions.placeholders.name')}
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('transactions.fields.ticker')} <span className="text-gray-400">{t('transactions.optional')}</span></label>
          <input
            className={FIELD_CLASS}
            type="text"
            placeholder={t('transactions.placeholders.ticker')}
            value={form.ticker}
            onChange={(event) => set('ticker', event.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.quantity')}</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder={t('transactions.placeholders.quantity')}
              value={form.quantity}
              onChange={(event) => set('quantity', event.target.value)}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.pricePerUnit')}</label>
            <input
              className={FIELD_CLASS}
              type="number"
              step="any"
              min="0"
              placeholder={t('transactions.placeholders.price')}
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.currency')}</label>
            <select className={FIELD_CLASS} value={form.currency} onChange={(event) => set('currency', event.target.value)}>
              <option value="EUR">EUR</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{t('transactions.fields.date')}</label>
            <input
              className={FIELD_CLASS}
              type="date"
              value={form.transactionDate}
              onChange={(event) => set('transactionDate', event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>{t('transactions.fields.broker')}</label>
          <select
            className={FIELD_CLASS}
            value={brokerSelect}
            onChange={(event) => setBrokerSelect(event.target.value)}
          >
            {KNOWN_BROKERS.map((broker) => (
              <option key={broker.id} value={broker.id}>{broker.name}</option>
            ))}
            <option value={OTHER_BROKER}>{t('transactions.placeholders.brokerOther')}</option>
          </select>
          {renderBrokerOtherInput()}
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition"
        >
          {submitting ? t('transactions.actions.saving') : t('transactions.actions.submit')}
        </button>
      </form>
    </div>
  );
};

const NewTransactionPage = () => (
  <Suspense fallback={null}>
    <NewTransactionForm />
  </Suspense>
);

export default NewTransactionPage;
