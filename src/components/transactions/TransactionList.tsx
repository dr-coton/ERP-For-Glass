import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { useTransactionStore } from '../../stores/transactionStore';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Table from '../ui/Table';
import TransactionForm from './TransactionForm';
import MonthlyDownloadModal from './MonthlyDownloadModal';
import type { TransactionSummary } from '../../types';

export default function TransactionList() {
  const {
    transactions,
    fetchTransactions,
    removeTransaction,
    downloadExcel,
  } = useTransactionStore();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const columns = [
    { key: 'id', header: '번호', width: '80px', align: 'center' as const },
    { key: 'display_date', header: '작성일', width: '120px', align: 'center' as const },
    { key: 'customer_name', header: '거래처명', width: '200px' },
    {
      key: 'total_amount',
      header: '총 금액',
      width: '150px',
      align: 'right' as const,
      render: (item: TransactionSummary) => formatAmount(item.total_amount),
    },
    { key: 'memo', header: '메모' },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'center' as const,
      render: (item: TransactionSummary) => (
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
