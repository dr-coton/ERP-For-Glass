import { useEffect, useState } from 'react';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useProductStore } from '../../stores/productStore';
import Button from '../ui/Button';
import Table from '../ui/Table';
import ProductForm from './ProductForm';
import type { Product } from '../../types';

export default function ProductList() {
  const {
    products,
    fetchProducts,
    removeProduct,
    importCsv,
    exportCsv,
  } = useProductStore();

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    const product = products.find((p) => p.name === selectedName);
    if (product) {
      setEditingProduct(product);
      setIsFormOpen(true);
    }
  };

  const handleDelete = async () => {
    if (selectedName && confirm('선택한 상품을 삭제하시겠습니까?')) {
      await removeProduct(selectedName);
      setSelectedName(null);
    }
  };

  const handleImport = async () => {
    const path = await open({
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (path) {
      try {
        const count = await importCsv(path as string);
        alert(`${count}개의 상품을 가져왔습니다.`);
      } catch (error) {
        alert('가져오기 중 오류가 발생했습니다: ' + error);
      }
    }
  };

  const handleExport = async () => {
    const path = await save({
      defaultPath: 'products.csv',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (path) {
      try {
        await exportCsv(path);
        alert('내보내기가 완료되었습니다.');
      } catch (error) {
        alert('내보내기 중 오류가 발생했습니다: ' + error);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('ko-KR').format(num);

  const columns = [
    { key: 'name', header: '품목명', width: '200px' },
    {
      key: 'production_price',
      header: '제작가',
      width: '120px',
      align: 'right' as const,
      render: (item: Product) => formatNumber(item.production_price),
    },
    {
      key: 'single_side_price',
      header: '일면(500)',
      width: '120px',
      align: 'right' as const,
      render: (item: Product) => formatNumber(item.single_side_price),
    },
    {
      key: 'double_side_price',
      header: '양면(700)',
      width: '120px',
      align: 'right' as const,
      render: (item: Product) => formatNumber(item.double_side_price),
    },
    {
      key: 'direct_price',
      header: '직매',
      width: '120px',
      align: 'right' as const,
      render: (item: Product) => formatNumber(item.direct_price),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleNew}>상품 추가</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleImport}>
            CSV 가져오기
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={products}
        onRowClick={(item) => setSelectedName(item.name)}
        selectedId={selectedName ?? undefined}
        emptyMessage="등록된 상품이 없습니다."
      />

      {/* Action Buttons */}
      {selectedName && (
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
        <ProductForm product={editingProduct} onClose={handleFormClose} />
      )}
    </div>
  );
}
