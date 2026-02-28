import { useState, useCallback } from 'react';
import { MobileDB } from './useMobileDB';

export const useDatabase = () => {
  const [db] = useState(new MobileDB());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await db.executeQuery(`
        SELECT id, name 
        FROM categories 
        ORDER BY name
      `);
      setCategories(result);
      return result;
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      return [];
    }
  }, [db]);

  const loadProductsByCategory = useCallback(async (categoryId) => {
    try {
      const result = await db.executeQuery(`
        SELECT id, name, price 
        FROM products 
        WHERE category_id = ?
        ORDER BY name
      `, [categoryId]);
      setProducts(result);
      return result;
    } catch (error) {
      console.error('Ошибка загрузки товаров по категории:', error);
      return [];
    }
  }, [db]);

  const loadAllProducts = useCallback(async () => {
    try {
      const result = await db.executeQuery(`
        SELECT p.id, p.name, p.price, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY c.name, p.name
      `);
      return result;
    } catch (error) {
      console.error('Ошибка загрузки всех товаров:', error);
      return [];
    }
  }, [db]);

  const searchProducts = useCallback(async (searchTerm) => {
    try {
      const result = await db.executeQuery(`
        SELECT p.id, p.name, p.price, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ?
        ORDER BY c.name, p.name
      `, [`%${searchTerm}%`]);
      return result;
    } catch (error) {
      console.error('Ошибка поиска товаров:', error);
      return [];
    }
  }, [db]);

  return {
    db,
    categories,
    products,
    loadCategories,
    loadProductsByCategory,
    loadAllProducts,
    searchProducts
  };
};