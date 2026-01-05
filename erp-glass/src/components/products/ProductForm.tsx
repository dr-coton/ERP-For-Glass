import { useState } from 'react';
import { useProductStore } from '../../stores/productStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { Product } from '../../types';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, editProduct } = useProductStore();

  const [form, setForm] = useState<Product>({
    name: product?.name || '',
    production_price: product?.production_price || 0,
    single_side_price: product?.single_side_price || 0,
    double_side_price: product?.double_side_price || 0,
    direct_price: product?.direct_price || 0,
  });

  const handleChange = (field: keyof Product, value: string | number) => {
    if (field === 'name') {
      setForm({ ...form, [field]: value as string });
    } else {
      setForm({ ...form, [field]: parseInt(value as string) || 0 });
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      alert('품목명을 입력하세요.');
      return;
    }

    try {
      if (product) {
        await editProduct(form);
      } else {
        await addProduct(form);
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
      title={product ? '상품 수정' : '상품 추가'}
      size="md"
    >
      <div className="space-y-4">
        <Input
          label="품목명"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={!!product}
        />
        <Input
          label="제작가"
          type="number"
          value={form.production_price}
          onChange={(e) => handleChange('production_price', e.target.value)}
        />
        <Input
          label="일면(500)"
          type="number"
          value={form.single_side_price}
          onChange={(e) => handleChange('single_side_price', e.target.value)}
        />
        <Input
          label="양면(700)"
          type="number"
          value={form.double_side_price}
          onChange={(e) => handleChange('double_side_price', e.target.value)}
        />
        <Input
          label="직매"
          type="number"
          value={form.direct_price}
          onChange={(e) => handleChange('direct_price', e.target.value)}
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
