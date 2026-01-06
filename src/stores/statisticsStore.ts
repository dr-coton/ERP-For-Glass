import { create } from 'zustand';
import type { PeriodType, StatisticsRequest, StatisticsResponse } from '../types';
import * as api from '../lib/tauri';

// 이번 달 첫째 날
function getFirstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// 이번 달 마지막 날
function getLastDayOfMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

interface StatisticsState {
  statistics: StatisticsResponse | null;
  loading: boolean;
  error: string | null;

  // 필터 상태
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  customerFilter: string | null;

  // Actions
  setPeriodType: (type: PeriodType) => void;
  setDateRange: (start: string, end: string) => void;
  setCustomerFilter: (customer: string | null) => void;
  fetchStatistics: () => Promise<void>;
  downloadExcel: (savePath: string) => Promise<string>;
}

export const useStatisticsStore = create<StatisticsState>((set, get) => ({
  statistics: null,
  loading: false,
  error: null,

  // 기본값: 이번 달
  periodType: 'monthly',
  startDate: getFirstDayOfMonth(),
  endDate: getLastDayOfMonth(),
  customerFilter: null,

  setPeriodType: (type) => set({ periodType: type }),

  setDateRange: (start, end) => set({ startDate: start, endDate: end }),

  setCustomerFilter: (customer) => set({ customerFilter: customer }),

  fetchStatistics: async () => {
    const { periodType, startDate, endDate, customerFilter } = get();
    set({ loading: true, error: null });

    try {
      const request: StatisticsRequest = {
        period_type: periodType,
        start_date: startDate,
        end_date: endDate,
        customer_name: customerFilter,
      };
      const statistics = await api.getStatistics(request);
      set({ statistics, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  downloadExcel: async (savePath) => {
    const { periodType, startDate, endDate, customerFilter } = get();
    const request: StatisticsRequest = {
      period_type: periodType,
      start_date: startDate,
      end_date: endDate,
      customer_name: customerFilter,
    };
    return api.downloadStatisticsExcel(request, savePath);
  },
}));
