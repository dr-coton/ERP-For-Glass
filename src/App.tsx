import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TransactionList from './components/transactions/TransactionList';
import CustomerList from './components/customers/CustomerList';
import ProductList from './components/products/ProductList';
import Settings from './components/settings/Settings';

type View = 'transactions' | 'customers' | 'products' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('transactions');

  const renderContent = () => {
    switch (currentView) {
      case 'transactions':
        return <TransactionList />;
      case 'customers':
        return <CustomerList />;
      case 'products':
        return <ProductList />;
      case 'settings':
        return <Settings />;
      default:
        return <TransactionList />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentView={currentView} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
