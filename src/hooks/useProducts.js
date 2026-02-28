// src/hooks/useProducts.js - Products hook
import { useState, useCallback } from 'react';
import { ProductService } from '../services/api';
import { db } from '../db';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Роллы', subcategory: '' });

  const refreshProducts = useCallback(async () => {
    try {
      console.log('[useProducts] Обновление продуктов...');
      const dbProducts = await ProductService.getAll();
      console.log('[useProducts] Продукты загружены:', dbProducts);
      setProducts(dbProducts);
      
      const pCats = await db.getSetting('product_categories');
      console.log('[useProducts] Категории из настроек:', pCats);
      if (pCats) {
        try {
          const categoriesData = JSON.parse(pCats);
          console.log('[useProducts] Категории распаршены:', categoriesData);
          setCategories(categoriesData);
          const catNames = categoriesData.map(c => typeof c === 'string' ? c : c.name);
          console.log('[useProducts] Имена категорий:', catNames);
          if (categoriesData.length > 0 && (!activeCat || !catNames.includes(activeCat))) {
            const newActiveCat = catNames[0] || '';
            console.log('[useProducts] Установка активной категории:', newActiveCat);
            setActiveCat(newActiveCat);
          }
        } catch (e) {
          console.error('[useProducts] Ошибка парсинга категорий:', e);
        }
      } else {
        console.log('[useProducts] Категории не найдены в настройках');
      }
    } catch (error) {
      console.error('[useProducts] Ошибка обновления продуктов:', error);
    }
  }, [activeCat]);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Заполните название и цену');
      return;
    }
    if (parseFloat(newProduct.price) <= 0) {
      alert('Цена должна быть больше нуля');
      return;
    }
    try {
      await ProductService.add({
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      setNewProduct({ name: '', price: '', category: activeCat || 'Роллы', subcategory: '' });
      await refreshProducts();
    } catch (err) {
      console.error("Ошибка добавления товара:", err);
      alert("Не удалось добавить товар");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await ProductService.delete(id);
      await refreshProducts();
    } catch (err) {
      console.error("Ошибка удаления товара:", err);
    }
  };

  return {
    products,
    categories,
    activeCat,
    setActiveCat,
    newProduct,
    setNewProduct,
    refreshProducts,
    handleAddProduct,
    handleDeleteProduct
  };
};