import { useEffect, useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import Button from '../ui/Button';
import Table from '../ui/Table';
import CustomerForm from './CustomerForm';
import type { Customer } from '../../types';

export default function CustomerList() {
  const { customers, fetchCustomers, removeCustomer } =
    useCustomerStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleNew = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    const customer = customers.find((c) => c.business_id === selectedId);
    if (customer) {
      setEditingCustomer(customer);
      setIsFormOpen(true);
    }
  };

  const handleDelete = async () => {
    if (selectedId && confirm('선택한 거래처를 삭제하시겠습니까?')) {
      await removeCustomer(selectedId);
      setSelectedId(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const columns = [
    { key: 'business_id', header: '사업자등록번호', width: '150px' },
    { key: 'company_name', header: '상호명', width: '180px' },
    { key: 'representative', header: '대표자', width: '120px' },
    { key: 'address', header: '주소' },
    { key: 'phone', header: '전화번호', width: '140px' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button onClick={handleNew}>거래처 추가</Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={customers}
        onRowClick={(item) => setSelectedId(item.business_id)}
        onRowDoubleClick={(item) => {
          setEditingCustomer(item);
          setIsFormOpen(true);
        }}
        selectedId={selectedId ?? undefined}
        emptyMessage="등록된 거래처가 없습니다."
      />

      {/* Action Buttons */}
      {selectedId && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleEdit}>
            수정
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            삭제
          </Button>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
