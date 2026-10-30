import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Icon } from './Icon';

type WalletSummary = {
  sample?: boolean;
  isSampleData?: boolean;
  currency: string;
  balance: number;
  pendingPayout: number;
  totalEarnings: number;
  totalSpent?: number;
  ledgerNote?: string;
  label?: string;
};

type Transaction = {
  id: string;
  date: string;
  title?: string;
  description?: string;
  type: 'credit' | 'debit';
  amount: number;
  status: string;
  reference: string;
};

/**
 * Wallet tab displaying current balance, read-only ledger, and transactions marked "Sample data".
 */
export default function WalletTab() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Fetch wallet balance and transaction ledger on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([api.wallet(), api.walletTransactions()])
      .then(([walletData, txData]) => {
        if (!cancelled) {
          setWallet(walletData);
          setTransactions(txData.transactions || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load wallet data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function formatDateTime(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Header and Sample data badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wallet & Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Sample data
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Read-only balance and transaction ledger for testing.</p>
        </div>
      </div>

      {/* Simulated action notice banner */}
      {simulatedNotice && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{simulatedNotice}</span>
          <button
            type="button"
            onClick={() => setSimulatedNotice(null)}
            className="text-sky-600 font-bold hover:text-sky-900 ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-bold underline hover:text-rose-900 ml-4"
          >
            Reload
          </button>
        </div>
      )}

      {/* Balance Card Skeleton */}
      {loading && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded-md w-24" />
          <div className="h-10 bg-slate-200 rounded-lg w-48" />
          <div className="h-4 bg-slate-100 rounded-md w-64" />
        </div>
      )}

      {/* Balance Card */}
      {!loading && wallet && (
        <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Balance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                  {wallet.currency}
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                ₦{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                {wallet.ledgerNote || 'Read-only ledger. Sample data only.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSimulatedNotice('Simulated Top Up: Real payment gateways are deferred to a later release.')}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Top Up (Test)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedNotice('Simulated Payout: Automated withdrawal will be available in production.')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Ledger Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Transaction Ledger</h2>
          <span className="text-xs font-bold text-slate-500">Read-Only</span>
        </div>

        {/* Transactions Skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 animate-pulse flex items-center justify-between">
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
                <div className="h-5 bg-slate-200 rounded-md w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Icon name="wallet" size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No transactions recorded</h4>
            <p className="text-xs text-slate-500 mt-1">Simulated ride transactions will appear in this ledger.</p>
          </div>
        )}

        {/* Transactions List */}
        {!loading && transactions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      tx.type === 'credit'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {tx.type === 'credit' ? 'IN' : 'OUT'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{tx.title || tx.description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatDateTime(tx.date)}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">{tx.reference}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-extrabold ${tx.type === 'credit' ? 'text-blue-700' : 'text-slate-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full mt-1">
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
