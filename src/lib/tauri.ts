import { invoke } from '@tauri-apps/api/core';
import type { Customer, Product, Transaction, TransactionSummary, SupplierSettings, StatisticsRequest, StatisticsResponse } from '../types';

// Customer API
export async function getCustomers(): Promise<Customer[]> {
  return invoke('get_customers');
}

export async function createCustomer(customer: Customer): Promise<void> {
  return invoke('create_customer', { customer });
}

export async function updateCustomer(customer: Customer): Promise<void> {
  return invoke('update_customer', { customer });
}

export async function deleteCustomer(businessId: string): Promise<void> {
  return invoke('delete_customer', { businessId });
}

// Product API
export async function getProducts(): Promise<Product[]> {
  return invoke('get_products');
}

export async function getProductByName(name: string): Promise<Product> {
  return invoke('get_product_by_name', { name });
}

export async function createProduct(product: Product): Promise<number> {
  return invoke('create_product', { product });
}

export async function updateProduct(product: Product): Promise<void> {
  return invoke('update_product', { product });
}

export async function deleteProduct(name: string): Promise<void> {
  return invoke('delete_product', { name });
}

export async function importProductsCsv(path: string): Promise<number> {
  return invoke('import_products_csv', { path });
}

export async function exportProductsCsv(path: string): Promise<void> {
  return invoke('export_products_csv', { path });
}

// Transaction API
export async function getTransactions(search?: string): Promise<TransactionSummary[]> {
  return invoke('get_transactions', { search: search ?? null });
}

export async function getTransaction(id: number): Promise<Transaction> {
  return invoke('get_transaction', { id });
}

export async function createTransaction(transaction: Transaction): Promise<number> {
  return invoke('create_transaction', { transaction });
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  return invoke('update_transaction', { transaction });
}

export async function deleteTransaction(id: number): Promise<void> {
  return invoke('delete_transaction', { id });
}

export async function getAvailableMonths(): Promise<string[]> {
  return invoke('get_available_months');
}

export async function downloadTransactionExcel(id: number, savePath: string): Promise<string> {
  return invoke('download_transaction_excel', { id, savePath });
}

export async function downloadMonthlyExcel(
  yearMonth: string,
  customerName: string | null,
  savePath: string
): Promise<string> {
  return invoke('download_monthly_excel', { yearMonth, customerName, savePath });
}

// Database API
export async function exportDatabase(path: string): Promise<void> {
  return invoke('export_database', { path });
}

export async function importDatabase(path: string): Promise<void> {
  return invoke('import_database', { path });
}

export async function getDatabasePath(): Promise<string> {
  return invoke('get_database_path');
}

// Supplier Settings API
export async function getSupplierSettings(): Promise<SupplierSettings> {
  return invoke('get_supplier_settings');
}

export async function updateSupplierSettings(settings: SupplierSettings): Promise<void> {
  return invoke('update_supplier_settings', { settings });
}

// Statistics API
export async function getStatistics(request: StatisticsRequest): Promise<StatisticsResponse> {
  return invoke('get_statistics', { request });
}

export async function downloadStatisticsExcel(
  request: StatisticsRequest,
  savePath: string
): Promise<string> {
  return invoke('download_statistics_excel', { request, savePath });
}
