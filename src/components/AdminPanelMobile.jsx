// src/components/AdminPanelMobile.jsx - Mobile admin panel
import React, { useState } from 'react';

const AdminPanelMobile = ({ 
  products, 
  orders, 
  shifts, 
  reports, 
  cart,
  isShiftOpen,
  onOpenShift,
  onCloseShift,
  onPrintShiftReport 
}) => {
  const [activeSection, setActiveSection] = useState('products');

  console.log('[AdminPanelMobile] Рендер компонента');

  const handleAddProduct = () => {
    console.log('[AdminPanelMobile] Добавление товара');
    // Логика добавления товара
  };

  const handleDeleteProduct = (id) => {
    console.log('[AdminPanelMobile] Удаление товара:', id);
    // Логика удаления товара
  };

  const handleOpenShiftClick = () => {
    console.log('[AdminPanelMobile] Открытие смены');
    onOpenShift();
  };

  const handleCloseShiftClick = (shiftData) => {
    console.log('[AdminPanelMobile] Закрытие смены:', shiftData);
    onCloseShift(shiftData);
  };

  const handlePrintReport = () => {
    console.log('[AdminPanelMobile] Печать отчета');
    onPrintShiftReport();
  };

  return (
    <div className="admin-panel-mobile">
      <div className="card">
        <div className="flex gap-10">
          <button 
            className={`btn ${activeSection === 'products' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveSection('products')}
          >
            Товары
          </button>
          <button 
            className={`btn ${activeSection === 'orders' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveSection('orders')}
          >
            Заказы
          </button>
          <button 
            className={`btn ${activeSection === 'shifts' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveSection('shifts')}
          >
            Смены
          </button>
          <button 
            className={`btn ${activeSection === 'reports' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveSection('reports')}
          >
            Отчеты
          </button>
        </div>
      </div>

      {activeSection === 'products' && (
        <div className="card">
          <div className="card-header">
            <h3>Управление товарами</h3>
            <button className="btn btn-success" onClick={handleAddProduct}>
              Добавить товар
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Цена</th>
                  <th>Категория</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.products && products.products.length > 0 ? (
                  products.products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.price} ₽</td>
                      <td>{product.category}</td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      Товары не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'orders' && (
        <div className="card">
          <div className="card-header">
            <h3>Заказы</h3>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Категория</th>
                  <th>Товары</th>
                  <th>Дата</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders && orders.orders.length > 0 ? (
                  orders.orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.category}</td>
                      <td>{order.items ? order.items.length : 0} позиций</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-info btn-sm">Просмотр</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Заказы не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'shifts' && (
        <div className="card">
          <div className="card-header">
            <h3>Управление сменами</h3>
            <div className="flex gap-10">
              {!isShiftOpen && (
                <button className="btn btn-success" onClick={handleOpenShiftClick}>
                  Открыть смену
                </button>
              )}
              {isShiftOpen && (
                <button className="btn btn-warning" onClick={handleCloseShiftClick}>
                  Закрыть смену
                </button>
              )}
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Кассир</th>
                  <th>Начало</th>
                  <th>Конец</th>
                  <th>Начальная сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {shifts.shiftHistory && shifts.shiftHistory.length > 0 ? (
                  shifts.shiftHistory.map(shift => (
                    <tr key={shift.id}>
                      <td>{shift.cashier}</td>
                      <td>{new Date(shift.openedAt).toLocaleString()}</td>
                      <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : 'Открыта'}</td>
                      <td>{shift.initialCash} ₽</td>
                      <td>
                        <span className={`badge ${shift.closedAt ? 'badge-success' : 'badge-warning'}`}>
                          {shift.closedAt ? 'Закрыта' : 'Открыта'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Смены не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'reports' && (
        <div className="card">
          <div className="card-header">
            <h3>Отчеты</h3>
            <button className="btn btn-info" onClick={handlePrintReport}>
              Печать отчета
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Продаж наличными</th>
                  <th>Продаж по карте</th>
                  <th>Расходы наличными</th>
                  <th>Расходы по карте</th>
                  <th>Итого</th>
                </tr>
              </thead>
              <tbody>
                {reports.reports && reports.reports.length > 0 ? (
                  reports.reports.map(date => (
                    <tr key={date}>
                      <td>{date}</td>
                      <td>0 ₽</td>
                      <td>0 ₽</td>
                      <td>0 ₽</td>
                      <td>0 ₽</td>
                      <td>0 ₽</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      Отчеты не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelMobile;