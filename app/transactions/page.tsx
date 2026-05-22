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
    <div className="text-center py-12 text-gray-500">
      <p className="mb-3">{t('transactions.list.empty')}</p>
      <a href="/transactions/new" className="text-blue-400 hover:text-blue-300 transition">
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
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            {t('transactions.list.confirmDelete')}
          </button>
          <button
            onClick={() => setConfirmingId(null)}
            className="text-xs text-gray-500 hover:text-gray-400 transition"
          >
            {t('transactions.list.cancelDelete')}
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => setConfirmingId(tx.id)}
        className="text-xs text-gray-600 hover:text-red-400 transition"
      >
        {t('transactions.list.delete')}
      </button>
    );
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="text-left pb-3">{t('transactions.list.columns.date')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.name')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.type')}</th>
            <th className="text-right pb-3">{t('transactions.list.columns.qty')}</th>
            <th className="text-right pb-3">{t('transactions.list.columns.price')}</th>
            <th className="text-left pb-3">{t('transactions.list.columns.broker')}</th>
            <th className="text-right pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-800/50">
              <td className="py-3 text-gray-400 text-xs">{tx.transactionDate}</td>
              <td className="py-3">
                <span className="text-white font-medium">{tx.name}</span>
                {tx.ticker && <span className="text-gray-500 text-xs ml-2">{tx.ticker}</span>}
              </td>
              <td className="py-3 text-gray-400">{tx.transactionType}</td>
              <td className="py-3 text-right text-gray-300">{tx.quantity}</td>
              <td className="py-3 text-right text-gray-300">
                {tx.price} {tx.currency}
              </td>
              <td className="py-3 text-gray-400">{tx.broker}</td>
              <td className="py-3 text-right">{renderDeleteCell(tx)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('transactions.listTitle')}</h1>
        <a
          href="/transactions/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition"
        >
          {t('transactions.actions.submit')}
        </a>
      </div>

      {deleteError && (
        <div className="bg-red-950 border border-red-800 rounded p-3 mb-4 text-sm text-red-400">
          {deleteError}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        {loading
          ? <p className="text-gray-500 text-sm">{t('common.loading')}</p>
          : transactions.length === 0 ? renderEmpty() : renderTable()
        }
      </div>
    </div>
  );
};

export default TransactionsPage;
