import React, { useEffect } from 'react';
import './ReceiptPrinter.css';

const ReceiptPrinter = ({ order, cashierName, shiftInfo, receiptType = 'client', onClose }) => {
  useEffect(() => {
    // Автоматически вызываем печать при монтировании компонента
    if (order) {
      const timer = setTimeout(() => {
        window.print();
        if (onClose) {
          onClose();
        }
      }, 1000); // Задержка для подготовки чека к печати

      return () => clearTimeout(timer);
    }
  }, [order, onClose]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Рассчитываем общую сумму заказа
  const calculateOrderTotal = () => {
    if (order.items && Array.isArray(order.items)) {
      return order.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
    return order.total_amount || 0;
  };

  const orderTotal = calculateOrderTotal();

  // Применяем скидку если она есть
  const discountAmount = orderTotal * (order.discount / 100);
  const finalTotal = orderTotal - discountAmount;

  return (
    <div className="receipt-container" style={{ display: 'none' }}>
      <div className="receipt" id="receipt-content">
        {receiptType === 'kitchen' ? (
          <div className="kitchen-receipt">
            <div className="receipt-header">
              <div className="receipt-title">КУХОННЫЙ ЧЕК</div>
              <div className="receipt-date">{formatDate(order.timestamp || new Date().toISOString())}</div>
            </div>
            
            <div className="receipt-details">
              <div className="detail-row">
                <span>Кассир:</span>
                <span>{cashierName}</span>
              </div>
              <div className="detail-row">
                <span>Категория:</span>
                <span className="category">{order.order_type?.toUpperCase() || 'ЗАЛ'}</span>
              </div>
            </div>
            
            <div className="items-section">
              <div className="items-header">Товары:</div>
              {order.items && Array.isArray(order.items) ? (
                order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-name">{item.name.toUpperCase()}</div>
                    <div className="item-qty">Кол-во: {item.quantity}</div>
                    {item.comment && (
                      <div className="item-comment">Комментарий: {item.comment}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-items">Нет товаров в заказе</div>
              )}
            </div>
          </div>
        ) : (
          <div className="client-receipt">
            <div className="receipt-header">
              <div className="establishment-name">Суши Бар "Азия"</div>
              <div className="receipt-date">{formatDate(order.timestamp || new Date().toISOString())}</div>
              <div className="cashier-name">Кассир: {cashierName}</div>
            </div>
            
            <div className="items-section">
              {order.items && Array.isArray(order.items) ? (
                order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-name">{item.name}</div>
                    <div className="item-qty">{item.quantity} x {item.price.toFixed(2)} ₽</div>
                    <div className="item-total">{(item.price * item.quantity).toFixed(2)} ₽</div>
                    {item.comment && (
                      <div className="item-comment">Комментарий: {item.comment}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-items">Нет товаров в заказе</div>
              )}
            </div>
            
            <div className="summary-section">
              <div className="summary-row">
                <span>Итого:</span>
                <span>{orderTotal.toFixed(2)} ₽</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Скидка {order.discount}%:</span>
                  <span>-{discountAmount.toFixed(2)} ₽</span>
                </div>
              )}
              <div className="summary-row final-total">
                <span>К оплате:</span>
                <span className="amount">{finalTotal.toFixed(2)} ₽</span>
              </div>
              <div className="summary-row">
                <span>Оплачено:</span>
                <span>{order.payment_type === 'cash' ? 'Наличные' : 'Карта'} {order.payment_type === 'cash' ? `(${order.cash_received} ₽)` : ''}</span>
              </div>
              {order.payment_type === 'cash' && order.change > 0 && (
                <div className="summary-row">
                  <span>Сдача:</span>
                  <span>{order.change.toFixed(2)} ₽</span>
                </div>
              )}
            </div>
            
            <div className="blank-lines">
              <div className="blank-line"></div>
              <div className="blank-line"></div>
              <div className="blank-line"></div>
              <div className="contact-info">
                <div>Адрес:</div>
                <div>Телефон:</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptPrinter;