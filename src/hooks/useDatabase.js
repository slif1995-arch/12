// src/hooks/useDatabase.js
import { useCallback } from 'react';
import { useMobileDB } from './useMobileDB';

/**
 * Хук для работы с базой данных в POS-системе
 * Предоставляет удобные методы для типовых операций
 */
export const useDatabase = () => {
  const { query, run, insert, isInitialized, error } = useMobileDB();

  // === Продукты ===
  
  const getProducts = useCallback(async () => {
    return await query('SELECT * FROM products WHERE active = 1 ORDER BY name');
  }, [query]);

  const getProductById = useCallback(async (id) => {
    const result = await query('SELECT * FROM products WHERE id = ?', [id]);
    return result.rows?.item(0) || null;
  }, [query]);

  const createProduct = useCallback(async (product) => {
    const { name, price, category_id, image, active = 1 } = product;
    return await insert(
      'INSERT INTO products (name, price, category_id, image, active) VALUES (?, ?, ?, ?, ?)',
      [name, price, category_id, image, active]
    );
  }, [insert]);

  const updateProduct = useCallback(async (id, updates) => {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    return await run(`UPDATE products SET ${setClause} WHERE id = ?`, values);
  }, [run]);

  // === Категории ===

  const getCategories = useCallback(async () => {
    return await query('SELECT * FROM categories ORDER BY name');
  }, [query]);

  const getCategoryWithProducts = useCallback(async (categoryId) => {
    const category = await query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    const products = await query('SELECT * FROM products WHERE category_id = ? AND active = 1', [categoryId]);
    return {
      ...category.rows?.item(0),
      products: Array.from(products.rows || [])
    };
  }, [query]);

  // === Заказы ===

  const createOrder = useCallback(async (orderData) => {
    const { customer_name, total, items, payment_method = 'cash' } = orderData;
    
    // Начинаем транзакцию (если поддерживается)
    const orderResult = await insert(
      'INSERT INTO orders (customer_name, total, payment_method, status, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [customer_name, total, payment_method, 'pending']
    );
    
    const orderId = orderResult.insertId;
    
    // Добавляем позиции заказа
    for (const item of items) {
      await insert(
        'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.subtotal]
      );
    }
    
    return { orderId, ...orderResult };
  }, [insert]);

  const getOrders = useCallback(async (limit = 50) => {
    return await query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
  }, [query]);

  const getOrderWithItems = useCallback(async (orderId) => {
    const order = await query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const items = await query(
      'SELECT oi.*, p.name as product_name, p.image FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [orderId]
    );
    
    return {
      ...order.rows?.item(0),
      items: Array.from(items.rows || [])
    };
  }, [query]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    return await run('UPDATE orders SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, orderId]);
  }, [run]);

  // === Статистика ===

  const getDailyStats = useCallback(async (date = new Date().toISOString().split('T')[0]) => {
    const stats = await query(
      `SELECT 
         COUNT(*) as total_orders,
         SUM(total) as revenue,
         AVG(total) as avg_check
       FROM orders 
       WHERE DATE(created_at) = ? AND status != 'cancelled'`,
      [date]
    );
    return stats.rows?.item(0) || { total_orders: 0, revenue: 0, avg_check: 0 };
  }, [query]);

  // === Утилиты ===

  const searchProducts = useCallback(async (searchTerm) => {
    const term = `%${searchTerm}%`;
    return await query(
      'SELECT * FROM products WHERE (name LIKE ? OR barcode LIKE ?) AND active = 1 ORDER BY name',
      [term, term]
    );
  }, [query]);

  const clearDatabase = useCallback(async () => {
    // Осторожно! Удаляет все данные
    await run('DELETE FROM order_items');
    await run('DELETE FROM orders');
    await run('DELETE FROM products');
    await run('DELETE FROM categories');
    return true;
  }, [run]);

  return {
    // Состояние
    isInitialized,
    error,
    
    // Продукты
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    searchProducts,
    
    // Категории
    getCategories,
    getCategoryWithProducts,
    
    // Заказы
    createOrder,
    getOrders,
    getOrderWithItems,
    updateOrderStatus,
    
    // Статистика
    getDailyStats,
    
    // Утилиты
    clearDatabase,
    
    // Прямой доступ к низкоуровневым методам (если нужно)
    raw: { query, run, insert }
  };
};