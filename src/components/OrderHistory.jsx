import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import './OrderHistory.css';

const OrderHistory = ({ currentShift, onClose }) => {
  const { db } = useDatabase();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentShift) return;

      try {
        const result = await db.executeQuery(`
          SELECT o.*, s.start_time as shift_start_time
          FROM orders o
          JOIN shifts s ON o.shift_id = s.id
          WHERE s.id = ?
          ORDER BY o.timestamp DESC
        `, [currentShift.id]);

        setOrders(result);
        setFilteredOrders(result);
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentShift, db]);

  useEffect(() => {
    let filtered = orders;

    switch (selectedFilter) {
      case 'paid':
        filtered = orders.filter(order => order.status === 'paid');
        break;
      case 'cancelled':
        filtered = orders.filter(order => order.status === 'cancelled');
        break;
      case 'pending':
        filtered = orders.filter(order => order.status === 'pending');
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
  }, [selectedFilter, orders]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'paid': return 'paid';
      case 'cancelled': return 'cancelled';
      case 'pending': return 'pending';
      default: return 'pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Оплачен';
      case 'cancelled': return 'Отменен';
      case 'pending': return 'В работе';
      default: return 'Неизвестен';
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
      return;
    }

    try {
      await db.executeQuery(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['cancelled', orderId]
      );

      // Обновляем состояние заказов
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      alert('Не удалось отменить заказ');
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <div className="order-history-overlay">
        <div className="order-history-modal">
          <div className="order-history-header">
            <h3>История заказов</h3>
            <button className="btn btn-close" onClick={onClose}>×</button>
          </div>
          <div className="order-history-content">
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-overlay">
      <div className="order-history-modal">
        <div className="order-history-header">
          <h3>История заказов</h3>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>

        <div className="order-history-content">
          <div className="order-filters">
            <button
              className={`order-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              Все
            </button>
            <button
              className={`order-filter-btn ${selectedFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('paid')}
            >
              Оплаченные
            </button>
            <button
              className={`order-filter-btn ${selectedFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('pending')}
            >
              В работе
            </button>
            <button
              className={`order-filter-btn ${selectedFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('cancelled')}
            >
              Отмененные
            </button>
          </div>

          <div className="orders-list">
            {filteredOrders.length === 0 ? (
              <p>Нет заказов для отображения</p>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className={`order-item ${getStatusClass(order.status)}`}>
                  <div className="order-header">
                    <h4>Заказ #{order.id}</h4>
                    <span className={`badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="order-details">
                    <div>
                      <p><strong>Время:</strong> {formatDate(order.timestamp)}</p>
                      <p><strong>Сумма:</strong> {order.total_amount} ₽</p>
                      <p><strong>Тип:</strong> {order.order_type}</p>
                      <p><strong>Оплата:</strong> {order.payment_type}</p>
                    </div>
                  </div>

                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <button
                        className="btn btn-cancel"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Отменить заказ
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;