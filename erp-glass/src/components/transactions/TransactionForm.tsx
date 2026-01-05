import { useEffect, useState } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useProductStore } from '../../stores/productStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import type { Transaction, TransactionItem, PriceType } from '../../types';
import { PRICE_TYPES } from '../../types';

interface TransactionFormProps {
  transactionId: number | null;
  onClose: () => void;
}

const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function TransactionForm({
  transactionId,
  onClose,
}: TransactionFormProps) {
  const { fetchTransaction, addTransaction, editTransaction } =
    useTransactionStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { products, fetchProducts, getProduct } = useProductStore();

  const [customerName, setCustomerName] = useState('');
  const [customerLocked, setCustomerLocked] = useState(false);
  const [memo, setMemo] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);

  // 항목 입력 상태
  const [itemDate, setItemDate] = useState(getToday());
  const [itemProduct, setItemProduct] = useState('');
  const [itemPriceType, setItemPriceType] = useState<PriceType>('제작가');
  const [itemWidth, setItemWidth] = useState('');
  const [itemHeight, setItemHeight] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();

    if (transactionId) {
      loadTransaction(transactionId);
    }
  }, [transactionId]);

  const loadTransaction = async (id: number) => {
    const tx = await fetchTransaction(id);
    setCustomerName(tx.customer_name);
    setCustomerLocked(true);
    setMemo(tx.memo || '');
    setItems(tx.items);
  };

  const handleLockCustomer = () => {
    if (!customerName) {
      alert('거래처를 선택하세요.');
      return;
    }
    setCustomerLocked(true);
  };

  const calculatePrice = async () => {
    if (!itemProduct || !itemWidth || !itemHeight || !itemQuantity) {
      return { unitPrice: 0, supplyPrice: 0 };
    }

    try {
      const product = await getProduct(itemProduct);
      const priceMap: Record<PriceType, number> = {
        '제작가': product.production_price,
        '일면(500)': product.single_side_price,
        '양면(700)': product.double_side_price,
        '직매': product.direct_price,
      };

      const basePrice = priceMap[itemPriceType];
      const width = parseInt(itemWidth);
      const height = parseInt(itemHeight);
      const quantity = parseInt(itemQuantity);

      const unitPrice = Math.floor((basePrice * width * height) / 90000);
      const supplyPrice = unitPrice * quantity;

      return { unitPrice, supplyPrice };
    } catch {
      return { unitPrice: 0, supplyPrice: 0 };
    }
  };

  const handleAddItem = async () => {
    if (!itemProduct) {
      alert('상품을 선택하세요.');
      return;
    }
    if (!itemPriceType) {
      alert('단가 종류를 선택하세요.');
      return;
    }
    if (!itemWidth || !itemHeight) {
      alert('규격을 입력하세요.');
      return;
    }
    if (!itemQuantity) {
      alert('수량을 입력하세요.');
      return;
    }

    const { unitPrice, supplyPrice } = await calculatePrice();

    const newItem: TransactionItem = {
      date: itemDate,
      product: itemProduct,
      price_type: itemPriceType,
      width: parseInt(itemWidth),
      height: parseInt(itemHeight),
      quantity: parseInt(itemQuantity),
      unit_price: unitPrice,
      supply_price: supplyPrice,
    };

    setItems([...items, newItem]);

    // 입력 필드 초기화 (날짜 제외)
    setItemWidth('');
    setItemHeight('');
    setItemQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.supply_price, 0);

  const handleSave = async () => {
    if (!customerName) {
      alert('거래처를 선택하세요.');
      return;
    }
    if (items.length === 0) {
      alert('최소 1개 이상의 항목을 추가하세요.');
      return;
    }

    const transaction: Transaction = {
      id: transactionId ?? undefined,
      customer_name: customerName,
      total_amount: totalAmount,
      memo: memo || undefined,
      items,
    };

    try {
      if (transactionId) {
        await editTransaction(transaction);
      } else {
        await addTransaction(transaction);
      }
      onClose();
    } catch (error) {
      alert('저장 중 오류가 발생했습니다: ' + error);
    }
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('ko-KR').format(num);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={transactionId ? '거래명세서 수정' : '새 거래명세서'}
      size="xl"
    >
      <div className="space-y-6">
        {/* 거래처 선택 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Select
                label="거래처"
                options={customers.map((c) => ({
                  value: c.company_name,
                  label: c.company_name,
                }))}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={customerLocked}
                placeholder="거래처 선택"
              />
            </div>
            {!customerLocked && (
              <Button onClick={handleLockCustomer}>거래처 확정</Button>
            )}
          </div>
        </div>

        {customerLocked && (
          <>
            {/* 항목 입력 */}
            <div className="p-4 border border-gray-200 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">항목 입력</h3>

              <div className="grid grid-cols-6 gap-3">
                <Input
                  label="날짜"
                  type="date"
                  value={itemDate}
                  onChange={(e) => setItemDate(e.target.value)}
                />
                <Select
                  label="상품"
                  options={products.map((p) => ({
                    value: p.name,
                    label: p.name,
                  }))}
                  value={itemProduct}
                  onChange={(e) => setItemProduct(e.target.value)}
                  placeholder="선택"
                />
                <Select
                  label="단가 종류"
                  options={PRICE_TYPES.map((t) => ({ value: t, label: t }))}
                  value={itemPriceType}
                  onChange={(e) => setItemPriceType(e.target.value as PriceType)}
                />
                <Input
                  label="가로 (mm)"
                  type="number"
                  value={itemWidth}
                  onChange={(e) => setItemWidth(e.target.value)}
                />
                <Input
                  label="세로 (mm)"
                  type="number"
                  value={itemHeight}
                  onChange={(e) => setItemHeight(e.target.value)}
                />
                <Input
                  label="수량"
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              </div>

              <Button onClick={handleAddItem} variant="secondary">
                항목 추가
              </Button>
            </div>

            {/* 항목 목록 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium text-gray-500">날짜</th>
                    <th className="py-2 px-3 text-left font-medium text-gray-500">품목</th>
                    <th className="py-2 px-3 text-center font-medium text-gray-500">단가종류</th>
                    <th className="py-2 px-3 text-center font-medium text-gray-500">규격</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">수량</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">단가</th>
                    <th className="py-2 px-3 text-right font-medium text-gray-500">공급가액</th>
                    <th className="py-2 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        항목을 추가하세요.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="bg-white">
                        <td className="py-2 px-3">{item.date}</td>
                        <td className="py-2 px-3">{item.product}</td>
                        <td className="py-2 px-3 text-center">{item.price_type}</td>
                        <td className="py-2 px-3 text-center">
                          {item.width} x {item.height}
                        </td>
                        <td className="py-2 px-3 text-right">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">
                          {formatNumber(item.unit_price)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatNumber(item.supply_price)}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 총 금액 */}
            <div className="text-right text-lg font-semibold">
              총 공급가액: {formatNumber(totalAmount)}원
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                rows={3}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!customerLocked}>
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
}
