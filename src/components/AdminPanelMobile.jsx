// src/components/AdminPanelMobile.jsx - Mobile admin panel
import React, { useState, useEffect } from 'react';
import { database } from '../database';

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
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [shiftsHistory, setShiftsHistory] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftOrders, setShiftOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newExpenseTypeName, setNewExpenseTypeName] = useState('');
  const [editingExpenseType, setEditingExpenseType] = useState(null);

  console.log('[AdminPanelMobile] Рендер компонента');

  useEffect(() => {
    loadExpenseTypes();
    loadShiftsHistory();
  }, []);

  const loadExpenseTypes = async () => {
    try {
      const types = await database.getExpenseTypes();
      setExpenseTypes(types);
    } catch (error) {
      console.error('Error loading expense types:', error);
    }
  };

  const loadShiftsHistory = async () => {
    try {
      const shifts = await database.getShiftsHistory();
      setShiftsHistory(shifts);
    } catch (error) {
      console.error('Error loading shifts history:', error);
    }
  };

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

  const handleAddExpenseType = async () => {
    if (newExpenseTypeName.trim()) {
      try {
        await database.createExpenseType(newExpenseTypeName.trim());
        setNewExpenseTypeName('');
        loadExpenseTypes();
      } catch (error) {
        console.error('Error adding expense type:', error);
      }
    }
  };

  const handleUpdateExpenseType = async (id, name) => {
    if (name.trim()) {
      try {
        await database.updateExpenseType(id, name.trim());
        setEditingExpenseType(null);
        loadExpenseTypes();
      } catch (error) {
        console.error('Error updating expense type:', error);
      }
    }
  };

  const handleDeleteExpenseType = async (id) => {
    try {
      await database.deleteExpenseType(id);
      loadExpenseTypes();
    } catch (error) {
      console.error('Error deleting expense type:', error);
    }
  };

  const handleViewShiftDetails = async (shift) => {
    setSelectedShift(shift);
    try {
      const shiftOrders = await database.getOrdersByShift(shift.id);
      const shiftExpenses = await database.getExpensesByShift(shift.id);
      setShiftOrders(shiftOrders);
      setExpenses(shiftExpenses);
    } catch (error) {
      console.error('Error loading shift details:', error);
    }
  };

  const handleBackToShiftsList = () => {
    setSelectedShift(null);
    setShiftOrders([]);
    setExpenses([]);
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
          <button 
            className={`btn ${activeSection === 'expenses' ? 'btn-primary' : 'btn-light'}`}
            onClick={() => setActiveSection('expenses')}
          >
            Расходы
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
                  <th>Тип оплаты</th>
                  <th>Скидка</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders && orders.orders.length > 0 ? (
                  orders.orders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.order_type || order.category}</td>
                      <td>{order.payment_type || 'cash'}</td>
                      <td>{order.discount || 0}%</td>
                      <td>{order.total_amount || 0} ₽</td>
                      <td>{new Date(order.timestamp || order.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${order.status === 'paid' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      Заказы не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'shifts' && !selectedShift && (
        <div className="card">
          <div className="card-header">
            <h3>История смен</h3>
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
                  <th>Нач. сумма</th>
                  <th>Итог</th>
                  <th>Выручка</th>
                  <th>Безнал</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {shiftsHistory && shiftsHistory.length > 0 ? (
                  shiftsHistory.map(shift => (
                    <tr key={shift.id}>
                      <td>{shift.employee_name}</td>
                      <td>{new Date(shift.start_time).toLocaleString()}</td>
                      <td>{shift.end_time ? new Date(shift.end_time).toLocaleString() : 'Открыта'}</td>
                      <td>{shift.initial_amount} ₽</td>
                      <td>{shift.final_amount ? `${shift.final_amount} ₽` : '-'}</td>
                      <td>{shift.total_revenue ? `${shift.total_revenue} ₽` : '-'}</td>
                      <td>{shift.card_revenue ? `${shift.card_revenue} ₽` : '-'}</td>
                      <td>
                        <span className={`badge ${shift.status === 'closed' ? 'badge-success' : 'badge-warning'}`}>
                          {shift.status === 'closed' ? 'Закрыта' : 'Открыта'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-info btn-sm"
                          onClick={() => handleViewShiftDetails(shift)}
                          disabled={shift.status !== 'closed'}
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      Смены не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'shifts' && selectedShift && (
        <div className="card">
          <div className="card-header">
            <h3>Детали смены: {selectedShift.employee_name}</h3>
            <div className="flex gap-10">
              <button className="btn btn-secondary" onClick={handleBackToShiftsList}>
                Назад
              </button>
            </div>
          </div>
          
          <div className="shift-details">
            <div className="row mb-20">
              <div className="col-md-6">
                <h4>Информация о смене</h4>
                <p><strong>Начало:</strong> {new Date(selectedShift.start_time).toLocaleString()}</p>
                <p><strong>Конец:</strong> {selectedShift.end_time ? new Date(selectedShift.end_time).toLocaleString() : 'Открыта'}</p>
                <p><strong>Начальная сумма:</strong> {selectedShift.initial_amount} ₽</p>
                <p><strong>Итоговая сумма:</strong> {selectedShift.final_amount ? `${selectedShift.final_amount} ₽` : '-'}</p>
                <p><strong>Общая выручка:</strong> {selectedShift.total_revenue ? `${selectedShift.total_revenue} ₽` : '-'}</p>
                <p><strong>Выручка по карте:</strong> {selectedShift.card_revenue ? `${selectedShift.card_revenue} ₽` : '-'}</p>
              </div>
              <div className="col-md-6">
                <h4>Расходы и платежи</h4>
                <p><strong>Терминал:</strong> {selectedShift.terminal_balance ? `${selectedShift.terminal_balance} ₽` : '-'}</p>
                <p><strong>Бензин:</strong> {selectedShift.fuel_expense ? `${selectedShift.fuel_expense} ₽` : '-'}</p>
                <p><strong>Зарплата:</strong> {selectedShift.salary_payments ? `${selectedShift.salary_payments} ₽` : '-'}</p>
                <p><strong>Расходы наличные:</strong> {selectedShift.cash_expenses ? `${selectedShift.cash_expenses} ₽` : '-'}</p>
                <p><strong>Расходы безнал:</strong> {selectedShift.transfer_expenses ? `${selectedShift.transfer_expenses} ₽` : '-'}</p>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <h4>Заказы</h4>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Тип</th>
                        <th>Сумма</th>
                        <th>Дата</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftOrders && shiftOrders.length > 0 ? (
                        shiftOrders.map(order => (
                          <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.order_type}</td>
                            <td>{order.total_amount} ₽</td>
                            <td>{new Date(order.timestamp).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${order.status === 'paid' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                                {order.status}
                              </span>
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
              
              <div className="col-md-6">
                <h4>Расходы</h4>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Тип</th>
                        <th>Сумма</th>
                        <th>Тип оплаты</th>
                        <th>Комментарий</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses && expenses.length > 0 ? (
                        expenses.map(expense => (
                          <tr key={expense.id}>
                            <td>{expense.expense_type_name}</td>
                            <td>{expense.amount} ₽</td>
                            <td>{expense.payment_type === 'cash' ? 'Наличные' : 'Безнал'}</td>
                            <td>{expense.comment}</td>
                            <td>{new Date(expense.timestamp).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">
                            Расходы не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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

      {activeSection === 'expenses' && (
        <div className="card">
          <div className="card-header">
            <h3>Управление категориями расходов</h3>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Новая категория расхода"
                value={newExpenseTypeName}
                onChange={(e) => setNewExpenseTypeName(e.target.value)}
              />
              <button className="btn btn-success" onClick={handleAddExpenseType}>
                Добавить
              </button>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {expenseTypes && expenseTypes.length > 0 ? (
                  expenseTypes.map(type => (
                    <tr key={type.id}>
                      <td>{type.id}</td>
                      <td>
                        {editingExpenseType === type.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            defaultValue={type.name}
                            onBlur={(e) => handleUpdateExpenseType(type.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateExpenseType(type.id, e.target.value);
                              }
                            }}
                          />
                        ) : (
                          type.name
                        )}
                      </td>
                      <td>
                        <button 
                          className="btn btn-warning btn-sm me-5"
                          onClick={() => setEditingExpenseType(type.id)}
                        >
                          Ред.
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteExpenseType(type.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">
                      Категории расходов не найдены
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