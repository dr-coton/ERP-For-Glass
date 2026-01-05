import { create } from 'zustand';
import type { Customer } from '../types';
import * as api from '../lib/tauri';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  editCustomer: (customer: Customer) => Promise<void>;
  removeCustomer: (businessId: string) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const customers = await api.getCustomers();
      set({ customers, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addCustomer: async (customer) => {
    try {
      await api.createCustomer(customer);
      await get().fetchCustomers();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  editCustomer: async (customer) => {
    try {
      await api.updateCustomer(customer);
      await get().fetchCustomers();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeCustomer: async (businessId) => {
    try {
      await api.deleteCustomer(businessId);
      await get().fetchCustomers();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },
}));
