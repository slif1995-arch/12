// src/hooks/useDatabase.js
import { useCallback } from 'react';
import { useMobileDB } from './useMobileDB';

/**
 * Хук для работы с базой данных в POS-системе
 * Предоставляет удобные методы для типовых операций
 */
export const useDatabase = () => {
  const { db, isInitialized, error } = useMobileDB();

  // === Продукты ===
  
  const getProducts = useCallback(async () => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.getProducts();
    }
    return await db.query('SELECT * FROM products WHERE active = 1 ORDER BY name');
  }, [db]);

  const getProductById = useCallback(async (id) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      const products = await db.getProducts();
      return products.find(p => p.id == id) || null;
    }
    const result = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }, [db]);

  const createProduct = useCallback(async (product) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.addProduct(product);
    }
    const { name, price, category_id, image, active = 1 } = product;
    return await db.query(
      'INSERT INTO products (name, price, category_id, image, active) VALUES (?, ?, ?, ?, ?)',
      [name, price, category_id, image, active]
    );
  }, [db]);

  const updateProduct = useCallback(async (id, updates) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.updateProduct(id, updates);
    }
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id); // Add ID as the last parameter for WHERE clause
    return await db.execute(
      `UPDATE products SET ${setClause} WHERE id = ?`,
      values
    );
  }, [db]);

  // === Категории ===

  const getCategories = useCallback(async () => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.getCategories();
    }
    return await db.query('SELECT * FROM categories ORDER BY name');
  }, [db]);

  const getCategoryWithProducts = useCallback(async (categoryId) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      const categories = await db.getCategories();
      const category = categories.find(c => c.id == categoryId);
      const products = await db.getProducts();
      return {
        ...category,
        products: products.filter(p => p.category_id == categoryId && p.active)
      };
    }
    const category = await db.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    const products = await db.query('SELECT * FROM products WHERE category_id = ? AND active = 1', [categoryId]);
    return {
      ...(category.values && category.values.length > 0 ? category.values[0] : {}),
      products: products.values || []
    };
  }, [db]);

  // === Заказы ===

  const createOrder = useCallback(async (orderData) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.createOrder(orderData.shiftId, orderData.orderType, orderData.paymentType, orderData.discount);
    }
    const { customer_name, total, items, payment_method = 'cash', shift_id } = orderData;
    
    // Start transaction for SQLite
    const orderResult = await db.query(
      'INSERT INTO orders (customer_name, total, payment_method, status, shift_id, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [customer_name, total, payment_method, 'pending', shift_id]
    );
    
    const orderId = orderResult.changes.lastId;
    
    // Add order items
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price, item.subtotal]
      );
    }
    
    return { orderId, ...orderResult };
  }, [db]);

  const getOrders = useCallback(async (limit = 50) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return await db.getOrders();
    }
    return await db.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
  }, [db]);

  const getOrderWithItems = useCallback(async (orderId) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      const orders = await db.getOrders();
      const order = orders.find(o => o.id == orderId);
      return order;
    }
    const order = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const items = await db.query(
      'SELECT oi.*, p.name as product_name, p.image FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [orderId]
    );
    
    return {
      ...(order.values && order.values.length > 0 ? order.values[0] : {}),
      items: items.values || []
    };
  }, [db]);

  const updateOrderStatus = useCallback(async (orderId, status) => {
    if (!db.isDbInitialized) {
      // Fallback to preferences if SQLite is not initialized
      return null; // Not implemented for preferences-based storage
    }
    return await db.execute('UPDATE orders SET status = ?, updated_at = datetime("now") WHERE id = ?', [status, orderId]);
  }, [db]);

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