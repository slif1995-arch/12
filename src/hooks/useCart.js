// src/hooks/useCart.js - Cart hook
import { useState, useCallback } from 'react';

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

  const saveCartToOrder = useCallback(async (category = 'ZAL') => {
    if (cart.length === 0) return null;
    
    const order = {
      id: Date.now().toString(),
      category: category,
      items: [...cart],
      createdAt: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    const savedOrders = JSON.parse(localStorage.getItem('sushi_orders') || '[]');
    savedOrders.push(order);
    localStorage.setItem('sushi_orders', JSON.stringify(savedOrders));
    
    // Сохраняем как текущий заказ
    setCurrentOrderId(order.id);
    localStorage.setItem('sushi_current_order', order.id);
    
    // Очищаем корзину
    clearCart();
    
    return order;
  }, [cart, clearCart]);

  const loadCartFromOrder = useCallback((orderId) => {
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