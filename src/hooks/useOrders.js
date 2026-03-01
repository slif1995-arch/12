// src/hooks/useOrders.js - Orders hook
import { useState, useEffect } from 'react';
import { db } from '../db';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Загрузка заказов из localStorage при инициализации
  useEffect(() => {
    console.log('[useOrders] useEffect: инициализация');
    const savedOrders = localStorage.getItem('sushi_orders');
    const savedCurrentOrder = localStorage.getItem('sushi_current_order');
    
    const loadOrders = async () => {
      try {
        console.log('[useOrders] Загрузка заказов из localStorage...');
        if (savedOrders) {
          try {
            const parsedOrders = JSON.parse(savedOrders);
            console.log('[useOrders] Заказы загружены:', parsedOrders);
            setOrders(parsedOrders);
          } catch (error) {
            console.error('[useOrders] Ошибка парсинга заказов:', error);
          }
        }
        
        if (savedCurrentOrder) {
          console.log('[useOrders] Текущий заказ:', savedCurrentOrder);
          setCurrentOrderId(savedCurrentOrder);
        }
      } catch (error) {
        console.error('[useOrders] Ошибка загрузки заказов:', error);
      }
    };
    
    loadOrders();
  }, []);

  // Сохранение заказов в localStorage
  const saveOrders = (newOrders) => {
    localStorage.setItem('sushi_orders', JSON.stringify(newOrders));
  };

  // Создание нового заказа
  const createOrder = async (shiftId, orderType = 'delivery', paymentType = 'cash', discount = 0) => {
    // Создаем заказ в базе данных
    const newOrder = await db.createOrder(shiftId, orderType, paymentType, discount);
    return newOrder;
  };

  // Обновление заказа
  const updateOrder = async (orderId, updates) => {
    const updatedOrder = await db.updateOrder(orderId, updates);
    return updatedOrder;
  };

  // Получение заказов по смене
  const getOrdersByShift = async (shiftId) => {
    const shiftOrders = await db.getOrdersByShift(shiftId);
    return shiftOrders;
  };

  // Удаление заказа
  const deleteOrder = (orderId) => {
    const newOrders = (orders || []).filter(order => order.id !== orderId);
    setOrders(newOrders);
    saveOrders(newOrders);
    
    // Если удаляем текущий заказ, переключаемся на первый доступный
    if (currentOrderId === orderId) {
      if (newOrders.length > 0) {
        setCurrentOrderId(newOrders[0].id);
      } else {
        setCurrentOrderId(null);
      }
    }
  };

  // Получение текущего активного заказа
  const getCurrentOrder = () => {
    return orders.find(order => order.id === currentOrderId) || null;
  };

  // Обновление items текущего заказа
  const updateCurrentOrderItems = (items) => {
    const newOrders = orders.map(order => 
      order.id === currentOrderId 
        ? { ...order, items }
        : order
    );
    setOrders(newOrders);
    saveOrders(newOrders);
  };

  // Удаление заказа из списка активных (после оплаты)
  const completeOrder = (orderId) => {
    deleteOrder(orderId);
  };

  // Переключение на другой заказ
  const selectOrder = (orderId) => {
    setCurrentOrderId(orderId);
    localStorage.setItem('sushi_current_order', orderId);
  };

  // Сохранение текущей корзины как заказ
  const saveCartAsOrder = async (cart, category = 'ZAL') => {
    if (cart.length === 0) return;
    
    const newOrder = {
      id: Date.now().toString(),
      category: category,
      items: [...cart],
      createdAt: new Date().toISOString()
    };
    
    const newOrders = [...orders, newOrder];
    setOrders(newOrders);
    saveOrders(newOrders);
    // Не переключаемся на новый заказ, оставляем текущий
    return newOrder;
  };

  // Получение суммы заказа
  const getOrderTotal = (orderId) => {
    const order = orders.find(order => order.id === orderId);
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  // Получение количества позиций в заказе
  const getOrderItemCount = (orderId) => {
    const order = orders.find(order => order.id === orderId);
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.qty, 0);
  };

  // Очистка всех заказов (для тестирования/сброса)
  const clearAllOrders = () => {
    setOrders([]);
    setCurrentOrderId(null);
    localStorage.removeItem('sushi_orders');
    localStorage.removeItem('sushi_current_order');
  };

  return {
    orders,
    currentOrderId,
    getCurrentOrder,
    createOrder,
    updateOrder,
    getOrdersByShift,
    deleteOrder,
    completeOrder,
    selectOrder,
    updateCurrentOrderItems,
    getOrderTotal,
    getOrderItemCount,
    clearAllOrders,
    saveCartAsOrder
  };
};