import { useState } from 'react';
import SupplierSettings from './SupplierSettings';
import DataManagement from './DataManagement';

type SettingsTab = 'supplier' | 'data';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('supplier');

  const tabs = [
    { id: 'supplier' as const, label: '공급자 정보' },
    { id: 'data' as const, label: '데이터 관리' },
  ];

  return (
    <div className="space-y-6">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'supplier' && <SupplierSettings />}
        {activeTab === 'data' && <DataManagement />}
      </div>
    </div>
  );
}
