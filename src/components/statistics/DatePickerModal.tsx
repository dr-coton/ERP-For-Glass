import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addYears,
  subYears,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isSameWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PeriodType } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
  periodType: PeriodType;
}

export default function DatePickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
  periodType,
}: DatePickerModalProps) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
  const handlePrevYear = () => setViewDate(subYears(viewDate, 1));
  const handleNextYear = () => setViewDate(addYears(viewDate, 1));

  const handleDateClick = (date: Date) => {
    onSelect(date);
    onClose();
  };

  const handleMonthClick = (month: number) => {
    const newDate = new Date(viewDate.getFullYear(), month, 1);
    if (periodType === 'monthly') {
      onSelect(newDate);
      onClose();
    } else {
      setViewDate(newDate);
      setViewMode('day');
    }
  };

  const handleYearClick = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('month');
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // 월 선택 뷰 렌더링
  const renderMonthView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrevYear}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('year')}
            className="text-sm font-semibold hover:bg-gray-100 px-2 py-1 rounded"
          >
            {viewDate.getFullYear()}년
          </button>
          <button
            onClick={handleNextYear}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {months.map((month) => {
            const isSelected = viewDate.getFullYear() === selectedDate.getFullYear() && month === selectedDate.getMonth();
            const isCurrent = viewDate.getFullYear() === currentYear && month === currentMonth;

            return (
              <button
                key={month}
                onClick={() => handleMonthClick(month)}
                className={`py-2 rounded text-sm font-medium transition-colors
                  ${isSelected ? 'bg-gray-900 text-white' : ''}
                  ${!isSelected && isCurrent ? 'bg-gray-100 text-gray-900' : ''}
                  ${!isSelected && !isCurrent ? 'hover:bg-gray-100' : ''}
                `}
              >
                {month + 1}월
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 연도 선택 뷰 렌더링
  const renderYearView = () => {
    const currentYear = new Date().getFullYear();
    const startYear = Math.floor(viewDate.getFullYear() / 10) * 10 - 1;
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewDate(subYears(viewDate, 10))}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold">
            {startYear + 1} - {startYear + 10}
          </span>
          <button
            onClick={() => setViewDate(addYears(viewDate, 10))}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {years.map((year) => {
            const isSelected = year === selectedDate.getFullYear();
            const isCurrent = year === currentYear;
            const isOutOfRange = year === startYear || year === startYear + 11;

            return (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                disabled={isOutOfRange}
                className={`py-2 rounded text-sm font-medium transition-colors
                  ${isSelected ? 'bg-gray-900 text-white' : ''}
                  ${!isSelected && isCurrent ? 'bg-gray-100 text-gray-900' : ''}
                  ${!isSelected && !isCurrent && !isOutOfRange ? 'hover:bg-gray-100' : ''}
                  ${isOutOfRange ? 'text-gray-300' : ''}
                `}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 일/주 선택 뷰 렌더링
  const renderDayView = () => {
    const days = generateCalendarDays();
    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
    const today = new Date();

    return (
      <div className="p-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className="text-sm font-semibold hover:bg-gray-100 px-2 py-1 rounded"
          >
            {format(viewDate, 'yyyy년 M월', { locale: ko })}
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="w-8 h-6 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isSelected = periodType === 'daily'
              ? isSameDay(day, selectedDate)
              : periodType === 'weekly'
                ? isSameWeek(day, selectedDate, { weekStartsOn: 1 })
                : false;
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={`w-8 h-8 rounded text-sm transition-colors
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${isSelected ? 'bg-gray-900 text-white' : ''}
                  ${!isSelected && isToday && isCurrentMonth ? 'bg-gray-100 font-semibold' : ''}
                  ${!isSelected && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {/* 오늘 버튼 */}
        <div className="mt-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewDate(new Date());
              handleDateClick(new Date());
            }}
          >
            오늘
          </Button>
        </div>
      </div>
    );
  };

  const getTitle = () => {
    switch (periodType) {
      case 'daily':
        return '날짜 선택';
      case 'weekly':
        return '주 선택';
      case 'monthly':
        return '월 선택';
      default:
        return '날짜 선택';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div>
        {periodType === 'monthly' || viewMode === 'month'
          ? viewMode === 'year'
            ? renderYearView()
            : renderMonthView()
          : viewMode === 'year'
            ? renderYearView()
            : renderDayView()}
      </div>
    </Modal>
  );
}
