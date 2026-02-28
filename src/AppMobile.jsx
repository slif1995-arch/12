// src/AppMobile.jsx - Mobile main component
import React, { useState, useEffect } from 'react';
import { useMobileDB } from './hooks/useMobileDB';
import AdminPanelMobile from './components/AdminPanelMobile';
import Cart from './components/Cart';
import { db } from './db';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';
import { useShifts } from './hooks/useShifts';
import { useReports } from './hooks/useReports';
import { useCart } from './hooks/useCart';

console.log('[AppMobile] Запуск мобильного приложения...');

function AppMobile() {
  const [activeTab, setActiveTab] = useState('products');
  const [currentCashier, setCurrentCashier] = useState('Кассир 1');
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  
  const mobileDB = useMobileDB();
  const products = useProducts();
  const orders = useOrders();
  const shifts = useShifts(currentCashier, null);
  const reports = useReports();
  const cart = useCart();

  useEffect(() => {
    console.log('[AppMobile] Компонент смонтирован');
    // Инициализация начальных данных
    const initApp = async () => {
      try {
        // Проверяем, есть ли открытая смена
        const openShift = await shifts.refreshShifts();
        if (openShift) {
          setIsShiftOpen(true);
        }
      } catch (error) {
        console.error('[AppMobile] Ошибка инициализации:', error);
      }
    };
    
    initApp();
  }, []);

  const handleOpenShift = async () => {
    const success = await shifts.handleOpenShift();
    if (success) {
      setIsShiftOpen(true);
    }
  };

  const handleCloseShift = async (shiftData) => {
    const success = await shifts.handleCloseShift(shiftData);
    if (success) {
      setIsShiftOpen(false);
    }
  };

  const handlePrintShiftReport = (reportData) => {
    console.log('[AppMobile] Печать отчета о смене:', reportData);
    // Здесь будет логика печати
  };

  if (mobileDB.error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h3>Ошибка базы данных</h3>
          <p>{mobileDB.error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Перезагрузить приложение
          </button>
        </div>
      </div>
    );
  }

  if (!mobileDB.isInitialized) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Инициализация приложения...</h2>
            <p>Пожалуйста, подождите</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-mobile">
      <header className="card">
        <div className="flex justify-between align-center">
          <div>
            <h1>Суши POS</h1>
            <p>Мобильная версия</p>
          </div>
          <div className="flex gap-10">
            <div className={`badge ${isShiftOpen ? 'badge-success' : 'badge-danger'}`}>
              {isShiftOpen ? 'Смена открыта' : 'Смена закрыта'}
            </div>
            <div className="badge badge-info">
              Кассир: {currentCashier}
            </div>
          </div>
        </div>
      </header>

      <nav className="card">
        <div className="flex gap-10">
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('products')}
          >
            Товары
          </button>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('orders')}
          >
            Заказы
          </button>
          <button 
            className={`btn ${activeTab === 'shifts' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('shifts')}
          >
            Смены
          </button>
          <button 
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveTab('reports')}
          >
            Отчеты
          </button>
        </div>
      </nav>

      <main className="container">
        {activeTab === 'products' && (
          <AdminPanelMobile
            products={products}
            orders={orders}
            shifts={shifts}
            reports={reports}
            cart={cart}
            isShiftOpen={isShiftOpen}
            onOpenShift={handleOpenShift}
            onCloseShift={handleCloseShift}
            onPrintShiftReport={handlePrintShiftReport}
          />
        )}
        
        {activeTab === 'orders' && (
          <Cart
            cart={cart}
            orders={orders}
            products={products}
            isShiftOpen={isShiftOpen}
          />
        )}
        
        {activeTab === 'shifts' && (
          <div className="card">
            <h3>Управление сменами</h3>
            <p>Функционал управления сменами</p>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="card">
            <h3>Отчеты</h3>
            <p>Функционал отчетов</p>
          </div>
        )}
      </main>

      <footer className="card text-center text-muted">
        <p>Суши POS Mobile &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default AppMobile;