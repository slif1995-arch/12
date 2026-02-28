// src/components/Cart.jsx - Mobile cart component
import React, { useState } from 'react';
import CartItemEditModal from './CartItemEditModal';
import PaymentModal from './PaymentModal';

const Cart = ({ cart, orders, products, isShiftOpen, currentShift, removeFromCart, updateQuantity, onClose, onCompleteOrder }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [editingItem, setEditingItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    // Показываем модальное окно оплаты
    setShowPaymentModal(true);
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

  const handlePaymentConfirm = async (paymentData) => {
    console.log('[Cart] Подтверждение оплаты:', paymentData);
    // Вызываем функцию завершения заказа с данными оплаты
    try {
      await onCompleteOrder(cart, paymentData);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('[Cart] Ошибка завершения заказа:', error);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  return (
    <div className="cart">
      <div className="card">
        <div className="card-header">
          <h3>Корзина</h3>
          <div className="flex gap-10">
            <span className="badge badge-info">
              Товаров: {cart.length}
            </span>
            <span className="badge badge-success">
              Сумма: {cartTotal.toFixed(2)} ₽
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
              {cart.length > 0 ? (
                cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.price.toFixed(2)} ₽</td>
                    <td>
                      <div className="flex gap-5 align-center">
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>{(item.price * item.quantity).toFixed(2)} ₽</td>
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
              disabled={!isShiftOpen || cart.length === 0}
            >
              Создать заказ
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCompleteOrder}
              disabled={!isShiftOpen || cart.length === 0}
            >
              Завершить заказ
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          currentShift={currentShift}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default Cart;