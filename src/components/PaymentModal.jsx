import React, { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ 
  cart, 
  currentShift, 
  onConfirm, 
  onCancel 
}) => {
  const [paymentType, setPaymentType] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [orderType, setOrderType] = useState('delivery');
  const [cashReceived, setCashReceived] = useState('');
  
  // Calculate original total
  const originalTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Apply discount
  const discountAmount = originalTotal * (discount / 100);
  const discountedTotal = originalTotal - discountAmount;
  
  // Calculate change if paying with cash
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const changeAmount = paymentType === 'cash' ? Math.max(0, cashReceivedAmount - discountedTotal) : 0;

  const handleConfirm = () => {
    const paymentData = {
      paymentType,
      discount,
      orderType,
      originalTotal,
      discountAmount,
      finalTotal: discountedTotal,
      cashReceived: paymentType === 'cash' ? cashReceivedAmount : 0,
      change: changeAmount
    };
    
    onConfirm(paymentData);
  };

  const handleDiscountChange = (value) => {
    if (value === 0 || value === 10 || value === 50) {
      setDiscount(value);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Оплата заказа</h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="payment-modal-body">
          <div className="order-summary">
            <h3>Состав заказа</h3>
            <div className="order-items">
              {cart.map(item => (
                <div key={item.id} className="order-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                  <span className="item-price">{(item.price * item.quantity).toFixed(2)} ₽</span>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="total-row">
                <span>Итого:</span>
                <span>{originalTotal.toFixed(2)} ₽</span>
              </div>
              
              {discount > 0 && (
                <div className="total-row discount">
                  <span>Скидка {discount}%:</span>
                  <span>-{discountAmount.toFixed(2)} ₽</span>
                </div>
              )}
              
              <div className="total-row final-total">
                <span>К оплате:</span>
                <span className="final-amount">{discountedTotal.toFixed(2)} ₽</span>
              </div>
            </div>
          </div>
          
          <div className="payment-options">
            <div className="form-group">
              <label>Способ оплаты:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="paymentType"
                    value="cash"
                    checked={paymentType === 'cash'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  <span>Наличные</span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="paymentType"
                    value="transfer"
                    checked={paymentType === 'transfer'}
                    onChange={(e) => setPaymentType(e.target.value)}
                  />
                  <span>Перевод</span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Скидка:</label>
              <div className="discount-buttons">
                <button
                  className={`discount-btn ${discount === 0 ? 'active' : ''}`}
                  onClick={() => handleDiscountChange(0)}
                >
                  0%
                </button>
                <button
                  className={`discount-btn ${discount === 10 ? 'active' : ''}`}
                  onClick={() => handleDiscountChange(10)}
                >
                  10%
                </button>
                <button
                  className={`discount-btn ${discount === 50 ? 'active' : ''}`}
                  onClick={() => handleDiscountChange(50)}
                >
                  50%
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Категория заказа:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="hall"
                    checked={orderType === 'hall'}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <span>ЗАЛ</span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="delivery"
                    checked={orderType === 'delivery'}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <span>ДОСТАВКА</span>
                </label>
                
                <label className="radio-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="pickup"
                    checked={orderType === 'pickup'}
                    onChange={(e) => setOrderType(e.target.value)}
                  />
                  <span>САМОВЫВОЗ</span>
                </label>
              </div>
            </div>
            
            {paymentType === 'cash' && (
              <div className="form-group">
                <label htmlFor="cashReceived">Получено наличных:</label>
                <input
                  type="number"
                  id="cashReceived"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="Введите сумму"
                  min="0"
                  step="0.01"
                  className="cash-input"
                />
                
                {cashReceivedAmount > 0 && (
                  <div className="change-display">
                    <span>Сдача: </span>
                    <span className="change-amount">{changeAmount.toFixed(2)} ₽</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="payment-modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button 
            className="btn btn-success" 
            onClick={handleConfirm}
            disabled={
              paymentType === 'cash' && 
              (cashReceivedAmount < discountedTotal || cashReceivedAmount <= 0)
            }
          >
            Подтвердить оплату
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;