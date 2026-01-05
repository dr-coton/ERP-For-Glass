import { create } from 'zustand';
import type { Product } from '../types';
import * as api from '../lib/tauri';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProduct: (name: string) => Promise<Product>;
  addProduct: (product: Product) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  removeProduct: (name: string) => Promise<void>;
  importCsv: (path: string) => Promise<number>;
  exportCsv: (path: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await api.getProducts();
      set({ products, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  getProduct: async (name) => {
    return api.getProductByName(name);
  },

  addProduct: async (product) => {
    try {
      await api.createProduct(product);
      await get().fetchProducts();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  editProduct: async (product) => {
    try {
      await api.updateProduct(product);
      await get().fetchProducts();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  removeProduct: async (name) => {
    try {
      await api.deleteProduct(name);
      await get().fetchProducts();
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  importCsv: async (path) => {
    const count = await api.importProductsCsv(path);
    await get().fetchProducts();
    return count;
  },

  exportCsv: async (path) => {
    await api.exportProductsCsv(path);
  },
}));
