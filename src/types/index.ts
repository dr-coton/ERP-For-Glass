export interface Customer {
  business_id: string;
  company_name: string;
  representative: string;
  address: string;
  phone: string;
}

export interface Product {
  id?: number;
  name: string;
  production_price: number;
  single_side_price: number;
  double_side_price: number;
  direct_price: number;
}

export type PriceType = '제작가' | '일면(500)' | '양면(700)' | '직매';

export const PRICE_TYPES: PriceType[] = ['제작가', '일면(500)', '양면(700)', '직매'];

export interface TransactionItem {
  id?: number;
  date: string;
  product: string;
  price_type: PriceType;
  width: number;
  height: number;
  quantity: number;
  unit_price: number;
  supply_price: number;
}

export interface Transaction {
  id?: number;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  memo?: string;
  created_at?: string;
  display_date?: string;
  items: TransactionItem[];
}

export interface TransactionSummary {
  id: number;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  memo?: string;
  display_date: string;
}

// 결제 상태 타입
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// 결제 상태 계산
export function getPaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= totalAmount) return 'paid';
  return 'partial';
}

// 결제 상태 한글 라벨
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    unpaid: '미수',
    partial: '일부수금',
    paid: '완납',
  };
  return labels[status];
}

export type View = 'transactions' | 'customers' | 'products' | 'settings' | 'statistics';

// Statistics Types
export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface StatisticsRequest {
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  customer_name?: string | null;
}

export interface PeriodStatistics {
  period_label: string;
  period_start: string;
  customer_name: string;
  total_amount: number;
  transaction_count: number;
}

export interface StatisticsResponse {
  period_type: PeriodType;
  start_date: string;
  end_date: string;
  data: PeriodStatistics[];
  grand_total: number;
}

export interface SupplierSettings {
  business_id: string;
  company_name: string;
  representative: string;
  address: string;
  phone: string;
  fax: string;
}
