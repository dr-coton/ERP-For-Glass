import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { useTransactionStore } from '../../stores/transactionStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Table from '../ui/Table';
import TransactionForm from './TransactionForm';
import MonthlyDownloadModal from './MonthlyDownloadModal';
import type { TransactionSummary } from '../../types';
import { getPaymentStatus, getPaymentStatusLabel } from '../../types';

export default function TransactionList() {
  const {
    transactions,
    fetchTransactions,
    removeTransaction,
    downloadExcel,
    markTransactionsPaid,
  } = useTransactionStore();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = () => {
    fetchTransactions(search || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleNew = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleView = (id?: number) => {
    const targetId = id ?? selectedId;
    if (targetId) {
      setEditingId(targetId);
      setIsFormOpen(true);
    }
  };

  const handleDelete = async () => {
    if (selectedId && confirm('선택한 거래명세서를 삭제하시겠습니까?')) {
      await removeTransaction(selectedId);
      setSelectedId(null);
    }
  };

  const handleDownload = async (id?: number) => {
    const targetId = id ?? selectedId;
    if (!targetId) return;

    const selected = transactions.find((t) => t.id === targetId);
    if (!selected) return;

    const path = await save({
      defaultPath: `거래명세서_${selected.display_date}_${selected.customer_name}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    if (path) {
      await downloadExcel(targetId, path);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
    fetchTransactions();
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (id: number, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleMarkPaid = async () => {
    if (selectedIds.size === 0) return;

    const unpaidIds = Array.from(selectedIds).filter((id) => {
      const tx = transactions.find((t) => t.id === id);
      return tx && tx.paid_amount < tx.total_amount;
    });

    if (unpaidIds.length === 0) {
      alert('선택한 거래가 모두 이미 완납 상태입니다.');
      return;
    }

    if (confirm(`${unpaidIds.length}건의 거래를 완납 처리하시겠습니까?`)) {
      await markTransactionsPaid(unpaidIds);
      setSelectedIds(new Set());
    }
  };

  const isAllSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const hasUnpaidSelected = Array.from(selectedIds).some((id) => {
    const tx = transactions.find((t) => t.id === id);
    return tx && tx.paid_amount < tx.total_amount;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadgeStyle = (status: ReturnType<typeof getPaymentStatus>) => {
    const styles = {
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
    };
    return styles[status];
  };

  const columns = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
      ),
      width: '40px',
      align: 'center' as const,
      render: (item: TransactionSummary) => (
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleCheckboxChange(item.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
        />
      ),
    },
    { key: 'id', header: '번호', width: '70px', align: 'center' as const },
    { key: 'display_date', header: '작성일', width: '100px', align: 'center' as const },
    { key: 'customer_name', header: '거래처명', width: '150px' },
    {
      key: 'total_amount',
      header: '총 금액',
      width: '120px',
      align: 'right' as const,
      render: (item: TransactionSummary) => formatAmount(item.total_amount),
    },
    {
      key: 'paid_amount',
      header: '받은 금액',
      width: '120px',
      align: 'right' as const,
      render: (item: TransactionSummary) => formatAmount(item.paid_amount),
    },
    {
      key: 'outstanding',
      header: '미수금',
      width: '120px',
      align: 'right' as const,
      render: (item: TransactionSummary) => {
        const outstanding = Math.max(0, item.total_amount - item.paid_amount);
        return (
          <span className={outstanding > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
            {formatAmount(outstanding)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: '상태',
      width: '80px',
      align: 'center' as const,
      render: (item: TransactionSummary) => {
        const status = getPaymentStatus(item.total_amount, item.paid_amount);
        return (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeStyle(status)}`}>
            {getPaymentStatusLabel(status)}
          </span>
        );
      },
    },
    { key: 'memo', header: '메모' },
    {
      key: 'actions',
      header: '',
      width: '90px',
      align: 'center' as const,
      render: (item: TransactionSummary) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(item.id);
            }}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="다운로드"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (confirm('이 거래명세서를 삭제하시겠습니까?')) {
                await removeTransaction(item.id);
                if (selectedId === item.id) {
                  setSelectedId(null);
                }
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleNew}>새 거래명세서</Button>
          <Button
            variant="secondary"
            onClick={() => setIsMonthlyModalOpen(true)}
          >
            월별 다운로드
          </Button>
          {selectedIds.size > 0 && hasUnpaidSelected && (
            <Button
              variant="secondary"
              onClick={handleMarkPaid}
              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              선택 완납 ({selectedIds.size}건)
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="거래처명 또는 메모로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-64"
          />
          <Button variant="secondary" onClick={handleSearch}>
            검색
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={transactions}
        onRowClick={(item) => setSelectedId(item.id)}
        onRowDoubleClick={(item) => handleView(item.id)}
        selectedId={selectedId ?? undefined}
        emptyMessage="거래명세서가 없습니다."
      />

      {/* Action Buttons */}
      {selectedId && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => handleView()}>
            상세보기
          </Button>
          <Button variant="secondary" onClick={() => handleDownload()}>
            다운로드
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <TransactionForm
          transactionId={editingId}
          onClose={handleFormClose}
        />
      )}

      {/* Monthly Download Modal */}
      <MonthlyDownloadModal
        isOpen={isMonthlyModalOpen}
        onClose={() => setIsMonthlyModalOpen(false)}
      />
    </div>
  );
}
