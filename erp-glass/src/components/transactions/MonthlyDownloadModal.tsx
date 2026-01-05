import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCustomerStore } from '../../stores/customerStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface MonthlyDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonthlyDownloadModal({
  isOpen,
  onClose,
}: MonthlyDownloadModalProps) {
  const { availableMonths, fetchAvailableMonths, downloadMonthlyExcel } =
    useTransactionStore();
  const { customers, fetchCustomers } = useCustomerStore();

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMonths();
      fetchCustomers();
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!selectedMonth) {
      alert('월을 선택하세요.');
      return;
    }

    const customerName = selectedCustomer || null;
    const fileName = customerName
      ? `${selectedMonth}_${customerName}_거래명세서.xlsx`
      : `${selectedMonth}_전체_거래명세서.xlsx`;

    const path = await save({
      defaultPath: fileName,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    if (path) {
      setLoading(true);
      try {
        await downloadMonthlyExcel(selectedMonth, customerName, path);
        alert('다운로드가 완료되었습니다.');
        onClose();
      } catch (error) {
        alert('다운로드 중 오류가 발생했습니다: ' + error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="월별 다운로드" size="sm">
      <div className="space-y-4">
        <Select
          label="년월 선택"
          options={availableMonths.map((m) => ({ value: m, label: m }))}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          placeholder="월 선택"
        />

        <Select
          label="거래처 선택"
          options={[
            { value: '', label: '전체 거래처' },
            ...customers.map((c) => ({
              value: c.company_name,
              label: c.company_name,
            })),
          ]}
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleDownload} disabled={loading || !selectedMonth}>
            {loading ? '다운로드 중...' : '다운로드'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
