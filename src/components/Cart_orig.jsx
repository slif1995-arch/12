// src/components/Cart.jsx - Mobile cart component
import React, { useState } from 'react';
import CartItemEditModal from './CartItemEditModal';

const Cart = ({ cart, orders, products, isShiftOpen, removeFromCart, updateQuantity, onClose }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [editingItem, setEditingItem] = useState(null);

  console.log('[Cart] Рендер корзины');

  const handleAddToCart = (product) => {
    console.log('[Cart] Добавление в корзину:', product);
    // Логика добавления в корзину
  };

  const handleRemoveFromCart = (productId) => {
    console.log('[Cart] Удаление из корзины:', productId);
    removeFromCart(productId);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    console.log('[Cart] Обновление количества:', productId, newQuantity);
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCreateOrder = () => {
    console.log('[Cart] Создание заказа');
    // Логика создания заказа
  };

  const handleCompleteOrder = () => {
    console.log('[Cart] Завершение заказа');
    // Логика завершения заказа
  };

  const handleSelectOrder = (order) => {
    console.log('[Cart] Выбор заказа:', order);
    setSelectedOrder(order);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
  };

  const handleSaveEditedItem = (updatedItem) => {
    updateQuantity(updatedItem.id, updatedItem.qty);
    // Note: Comments are handled differently in the actual implementation
    setEditingItem(null);
  };

  const handleCloseEditModal = () => {
    setEditingItem(null);
  };

  const cartTotal = cart.getTotal ? cart.getTotal() : 0;
  const cartItems = cart.cart || [];

  return (
    <div className="cart">
      <div className="card">
        <div className="card-header">
          <h3>Корзина</h3>
          <div className="flex gap-10">
            <span className="badge badge-info">
              Товаров: {cart.getItemCount ? cart.getItemCount() : 0}
            </span>
            <span className="badge badge-success">
              Сумма: {cartTotal} ₽
            </span>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Цена</th>
                <th>Количество</th>
                <th>Сумма</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.price} ₽</td>
                    <td>
                      <div className="flex gap-5 align-center">
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.qty - 1)}
                        >
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{(item.price * item.qty).toFixed(2)} ₽</td>
                    <td>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        Удалить
                      </button>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEditItem(item)}
                      >
                        Редактировать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    Корзина пуста
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="card-footer">
          <div className="flex gap-10">
            <button 
              className="btn btn-success"
              onClick={handleCreateOrder}
              disabled={!isShiftOpen || cartItems.length === 0}
            >
              Создать заказ
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCompleteOrder}
              disabled={!isShiftOpen || cartItems.length === 0}
            >
              Завершить заказ
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Активные заказы</h3>
        </div>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Категория</th>
                <th>Товары</th>
                <th>Сумма</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.orders && orders.orders.length > 0 ? (
                orders.orders.map(order => (
                  <tr key={order.id} className={selectedOrder?.id === order.id ? 'table-active' : ''}>
                    <td>{order.id}</td>
                    <td>{order.category}</td>
                    <td>{order.items ? order.items.length : 0} позиций</td>
                    <td>
                      {order.items ? order.items.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0} ₽
                    </td>
                    <td>
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={() => handleSelectOrder(order)}
                      >
                        Выбрать
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    Активные заказы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="card">
          <div className="card-header">
            <h3>Детали заказа {selectedOrder.id}</h3>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Цена</th>
                  <th>Количество</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.price} ₽</td>
                      <td>{item.qty}</td>
                      <td>{(item.price * item.qty).toFixed(2)} ₽</td>
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
              <tfoot>
                <tr>
                  <th colSpan="3" className="text-right">Итого:</th>
                  <th>
                    {selectedOrder.items ? selectedOrder.items.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0} ₽
                  </th>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="card-footer">
            <div className="flex gap-10">
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Наличные</option>
                <option value="TRANSFER">Карта</option>
              </select>
              <button className="btn btn-success">
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;