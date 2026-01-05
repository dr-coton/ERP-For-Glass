import { useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { Customer } from '../../types';

interface CustomerFormProps {
  customer: Customer | null;
  onClose: () => void;
}

export default function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const { addCustomer, editCustomer } = useCustomerStore();

  const [form, setForm] = useState<Customer>({
    business_id: customer?.business_id || '',
    company_name: customer?.company_name || '',
    representative: customer?.representative || '',
    address: customer?.address || '',
    phone: customer?.phone || '',
  });

  const handleChange = (field: keyof Customer, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form.business_id) {
      alert('사업자등록번호를 입력하세요.');
      return;
    }
    if (!form.company_name) {
      alert('상호명을 입력하세요.');
      return;
    }

    try {
      if (customer) {
        await editCustomer(form);
      } else {
        await addCustomer(form);
      }
      onClose();
    } catch (error) {
      alert('저장 중 오류가 발생했습니다: ' + error);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={customer ? '거래처 수정' : '거래처 추가'}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="사업자등록번호"
          value={form.business_id}
          onChange={(e) => handleChange('business_id', e.target.value)}
          disabled={!!customer}
        />
        <Input
          label="상호명"
          value={form.company_name}
          onChange={(e) => handleChange('company_name', e.target.value)}
        />
        <Input
          label="대표자"
          value={form.representative}
          onChange={(e) => handleChange('representative', e.target.value)}
        />
        <Input
          label="주소"
          value={form.address}
          onChange={(e) => handleChange('address', e.target.value)}
        />
        <Input
          label="전화번호"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}
