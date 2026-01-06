import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { useCustomerStore } from '@/stores/customerStore';
import type { PeriodType } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import DatePickerModal from './DatePickerModal';

const PERIOD_OPTIONS = [
  { value: 'daily', label: '일별' },
  { value: 'weekly', label: '주별' },
  { value: 'monthly', label: '월별' },
  { value: 'custom', label: '기간' },
];

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function Statistics() {
  const {
    statistics,
    loading,
    periodType,
    startDate,
    endDate,
    customerFilter,
    setPeriodType,
    setDateRange,
    setCustomerFilter,
    fetchStatistics,
    downloadExcel,
  } = useStatisticsStore();

  const { customers, fetchCustomers } = useCustomerStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 로컬 상태: 기준 날짜
  const [baseDate, setBaseDate] = useState(new Date());

  // 초기 데이터 로드
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 기간 타입 또는 기준 날짜 변경 시 날짜 범위 업데이트
  useEffect(() => {
    updateDateRange();
  }, [periodType, baseDate]);

  const updateDateRange = () => {
    switch (periodType) {
      case 'daily': {
        const dateStr = formatDateString(baseDate);
        setDateRange(dateStr, dateStr);
        break;
      }
      case 'weekly': {
        const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // 월요일 시작
        const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
        setDateRange(formatDateString(weekStart), formatDateString(weekEnd));
        break;
      }
      case 'monthly': {
        const monthStart = startOfMonth(baseDate);
        const monthEnd = endOfMonth(baseDate);
        setDateRange(formatDateString(monthStart), formatDateString(monthEnd));
        break;
      }
      case 'custom':
        // 기존 날짜 유지
        break;
    }
  };

  const handlePrev = () => {
    switch (periodType) {
      case 'daily':
        setBaseDate(subDays(baseDate, 1));
        break;
      case 'weekly':
        setBaseDate(subWeeks(baseDate, 1));
        break;
      case 'monthly':
        setBaseDate(subMonths(baseDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (periodType) {
      case 'daily':
        setBaseDate(addDays(baseDate, 1));
        break;
      case 'weekly':
        setBaseDate(addWeeks(baseDate, 1));
        break;
      case 'monthly':
        setBaseDate(addMonths(baseDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setBaseDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setBaseDate(date);
  };

  const handlePeriodTypeChange = (type: PeriodType) => {
    setPeriodType(type);
    setBaseDate(new Date()); // 타입 변경 시 오늘로 리셋
  };

  const handleSearch = () => {
    fetchStatistics();
  };

  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const periodLabel = PERIOD_OPTIONS.find((o) => o.value === periodType)?.label || '통계';
      const path = await save({
        defaultPath: `${periodLabel}_통계_${startDate}_${endDate}.xlsx`,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });

      if (path) {
        await downloadExcel(path);
        alert('엑셀 다운로드가 완료되었습니다.');
      }
    } catch (error) {
      alert('다운로드 중 오류가 발생했습니다: ' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 거래처 옵션 생성
  const customerOptions = [
    { value: '', label: '전체 거래처' },
    ...customers.map((c) => ({ value: c.company_name, label: c.company_name })),
  ];

  // 테이블 컬럼 정의
  const columns = [
    { key: 'period_label', header: '기간', width: '180px', align: 'center' as const },
    { key: 'customer_name', header: '거래처', width: '200px' },
    {
      key: 'transaction_count',
      header: '거래 건수',
      width: '100px',
      align: 'center' as const,
      render: (item: { transaction_count: number }) => `${item.transaction_count}건`,
    },
    {
      key: 'total_amount',
      header: '합계 금액',
      width: '150px',
      align: 'right' as const,
      render: (item: { total_amount: number }) => formatAmount(item.total_amount),
    },
  ];

  // 현재 선택된 기간 표시 텍스트
  const getDisplayText = () => {
    switch (periodType) {
      case 'daily':
        return format(baseDate, 'yyyy년 M월 d일 (EEE)', { locale: ko });
      case 'weekly': {
        const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'yyyy년 M월 d일', { locale: ko })} ~ ${format(weekEnd, 'M월 d일', { locale: ko })}`;
      }
      case 'monthly':
        return format(baseDate, 'yyyy년 M월', { locale: ko });
      case 'custom':
        return `${startDate} ~ ${endDate}`;
    }
  };

  // 기간 선택 UI 렌더링
  const renderDateSelector = () => {
    if (periodType === 'custom') {
      return (
        <>
          <div className="w-40">
            <Input
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setDateRange(e.target.value, endDate)}
            />
          </div>
          <div className="w-40">
            <Input
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setDateRange(startDate, e.target.value)}
            />
          </div>
        </>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 mr-1">
          {periodType === 'daily' ? '날짜' : periodType === 'weekly' ? '주' : '월'}
        </span>
        <button
          onClick={handlePrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          title="이전"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => setIsDatePickerOpen(true)}
          className="min-w-[200px] h-10 px-4 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {getDisplayText()}
          <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={handleNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          title="다음"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={handleToday}
          className="h-8 px-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          오늘
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 영역 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 기간 유형 */}
          <div className="w-32">
            <Select
              label="기간 유형"
              options={PERIOD_OPTIONS}
              value={periodType}
              onChange={(e) => handlePeriodTypeChange(e.target.value as PeriodType)}
            />
          </div>

          {/* 기간 선택 (타입에 따라 다른 UI) */}
          {renderDateSelector()}

          {/* 거래처 필터 */}
          <div className="w-48">
            <Select
              label="거래처"
              options={customerOptions}
              value={customerFilter || ''}
              onChange={(e) => setCustomerFilter(e.target.value || null)}
            />
          </div>

          {/* 조회 버튼 */}
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? '조회 중...' : '조회'}
          </Button>
        </div>
      </div>

      {/* 툴바 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {statistics && (
            <>
              조회 결과: <span className="font-medium">{statistics.data.length}건</span>
            </>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={handleDownloadExcel}
          disabled={isDownloading || !statistics || statistics.data.length === 0}
        >
          {isDownloading ? '다운로드 중...' : '엑셀 다운로드'}
        </Button>
      </div>

      {/* 결과 테이블 */}
      <Table
        columns={columns}
        data={statistics?.data || []}
        emptyMessage="조회된 데이터가 없습니다. 기간을 선택하고 조회 버튼을 클릭하세요."
      />

      {/* 총 합계 */}
      {statistics && statistics.data.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex justify-between items-center">
          <span className="font-medium text-gray-700">총 합계</span>
          <span className="text-lg font-bold text-gray-900">
            {formatAmount(statistics.grand_total)}
          </span>
        </div>
      )}

      {/* 날짜 선택 모달 */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={handleDateSelect}
        selectedDate={baseDate}
        periodType={periodType}
      />
    </div>
  );
}
