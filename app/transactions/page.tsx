'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '@/domains/shared/types';

const TransactionsPage = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.transactions) setTransactions(data.transactions);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setDeleteError(t('transactions.list.deleteError'));
        return;
      }
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    } catch {
      setDeleteError(t('transactions.list.deleteError'));
    } finally {
      setConfirmingId(null);
    }
  };

  const renderEmpty = () => (
    <div className="text-center py-12 text-gray-400">
      <p className="mb-3">{t('transactions.list.empty')}</p>
      <a href="/transactions/new" className="text-indigo-600 hover:text-indigo-700 transition">
        {t('transactions.list.addFirst')}
      </a>
    </div>
  );

  const renderDeleteCell = (tx: Transaction) => {
    if (confirmingId === tx.id) {
      return (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleDelete(tx.id)}
            className="text-xs text-red-500 hover:text-red-600 transition"
          >
            {t('transactions.list.confirmDelete')}
          </button>
          <button
            onClick={() => setConfirmingId(null)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            {t('transactions.list.cancelDelete')}
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirmingId(tx.id)}
        className="text-xs text-gray-400 hover:text-red-500 transition"
      >
        {t('transactions.list.delete')}
      </button>
    );
  };

  const renderRow = (tx: Transaction) => (
    <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="py-3 text-gray-500 text-xs">{tx.transactionDate}</td>
      <td className="py-3">
        <span className="text-gray-900 font-medium">{tx.name}</span>
        {tx.ticker && <span className="text-gray-400 text-xs ml-2">{tx.ticker}</span>}
      </td>
      <td className="py-3 text-gray-500">{tx.transactionType}</td>
      <td className="py-3 text-right text-gray-700">{tx.quantity}</td>
      <td className="py-3 text-right text-gray-700">
        {tx.price} {tx.currency}
      </td>
      <td className="py-3 text-gray-500">{tx.broker}</td>
      <td className="py-3 text-right">{renderDeleteCell(tx)}</td>
    </tr>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-slate-100">
            <th className="text-left pb-3">{t('transactions.list.columns.date')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.name')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.type')}</th>
            <th className="text-right pb-3">{t('transactions.list.columns.qty')}</th>
            <th className="text-right pb-3">{t('transactions.list.columns.price')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.broker')}</th>
            <th className="text-right pb-3"></th>
          </tr>
        </thead>
        <tbody>{transactions.map(renderRow)}</tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('transactions.listTitle')}</h1>
        <a
          href="/transactions/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          {t('transactions.actions.submit')}
        </a>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {loading
          ? <p className="text-gray-400 text-sm">{t('common.loading')}</p>
          : transactions.length === 0 ? renderEmpty() : renderTable()
        }
      </div>
    </div>
  );
};

export default TransactionsPage;
