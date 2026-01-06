import type { View } from '../../types';

interface HeaderProps {
  currentView: View;
}

const titles: Record<View, string> = {
  transactions: '거래명세서 관리',
  customers: '거래처 관리',
  products: '상품 관리',
  statistics: '통계',
  settings: '설정',
};

export default function Header({ currentView }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
      <h2 className="text-lg font-semibold text-gray-900">
        {titles[currentView]}
      </h2>
    </header>
  );
}
