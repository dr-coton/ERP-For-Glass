import { create } from 'zustand';
import type { Transaction, TransactionSummary } from '../types';
import * as api from '../lib/tauri';

interface TransactionState {
  transactions: TransactionSummary[];
  currentTransaction: Transaction | null;
  availableMonths: string[];
  loading: boolean;
  error: string | null;
  fetchTransactions: (search?: string) => Promise<void>;
  fetchTransaction: (id: number) => Promise<Transaction>;
  fetchAvailableMonths: () => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<number>;
  editTransaction: (transaction: Transaction) => Promise<void>;
  removeTransaction: (id: number) => Promise<void>;
  markTransactionsPaid: (ids: number[]) => Promise<void>;
  downloadExcel: (id: number, savePath: string) => Promise<string>;
  downloadMonthlyExcel: (
    yearMonth: string,
    customerName: string | null,
    savePath: string
  ) => Promise<string>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  currentTransaction: null,
  availableMonths: [],
  loading: false,
  error: null,

  fetchTransactions: async (search) => {
    set({ loading: true, error: null });
    try {
      const transactions = await api.getTransactions(search);
      set({ transactions, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      const transaction = await api.getTransaction(id);
      set({ currentTransaction: transaction, loading: false });
      return transaction;
    } catch (error) {
      set({ error: String(error), loading: false });
      throw error;
    }
  },

  fetchAvailableMonths: async () => {
    try {
      const months = await api.getAvailableMonths();
      set({ availableMonths: months });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  addTransaction: async (transaction) => {
    try {
      const id = await api.createTransaction(transaction);
      await get().fetchTransactions();
      return id;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  editTransaction: async (transaction) => {
    try {
      await api.updateTransaction(transaction);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeTransaction: async (id) => {
    try {
      await api.deleteTransaction(id);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  markTransactionsPaid: async (ids) => {
    try {
      await api.markTransactionsPaid(ids);
      await get().fetchTransactions();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  downloadExcel: async (id, savePath) => {
    return api.downloadTransactionExcel(id, savePath);
  },

  downloadMonthlyExcel: async (yearMonth, customerName, savePath) => {
    return api.downloadMonthlyExcel(yearMonth, customerName, savePath);
  },
}));
