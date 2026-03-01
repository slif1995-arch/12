// src/hooks/useCart.js - Cart hook
import { useState, useCallback } from 'react';
import { OrderService } from '../services/api';

export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const addToCart = useCallback((product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(prevCart => 
        prevCart.map(item => 
          item.id === product.id 
            ? { ...item, qty: item.qty + quantity }
            : item
        )
      );
    } else {
      setCart(prevCart => [...prevCart, { ...product, qty: quantity }]);
    }
  }, [cart]);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, qty: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const saveCartToOrder = useCallback(async (shiftId, category = 'delivery', paymentType = 'cash') => {
    if (cart.length === 0) return null;
    
    // Вычисляем общую сумму заказа
    const totalAmount = getTotal();
    
    // Создаем заказ через сервис
    const order = await OrderService.create({
      shift_id: shiftId,
      order_type: category,
      payment_type: paymentType,
      total_amount: totalAmount,
      status: 'pending'
    });
    
    // Обновляем заказ с деталями корзины
    await OrderService.update(order.id, {
      items: [...cart]
    });
    
    // Очищаем корзину
    clearCart();
    
    return order;
  }, [cart, clearCart, getTotal]);

  const loadCartFromOrder = useCallback((orderId) => {
    // В реальной реализации загружаем заказ и его содержимое
    // Пока используем localStorage для совместимости
    const savedOrders = JSON.parse(localStorage.getItem('sushi_orders') || '[]');
    const order = savedOrders.find(o => o.id === orderId);
    
    if (order) {
      setCart(order.items || []);
      setCurrentOrderId(orderId);
    }
  }, []);

  return {
    cart,
    currentOrderId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    saveCartToOrder,
    loadCartFromOrder
  };
};