// src/hooks/useMobileDB.js - Mobile database hook
import { useState, useEffect } from 'react';
import { db } from '../db';

export const useMobileDB = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('[useMobileDB] Инициализация базы данных...');
        await db.init();
        console.log('[useMobileDB] База данных инициализирована успешно');
        setIsInitialized(true);
      } catch (err) {
        console.error('[useMobileDB] Ошибка инициализации базы данных:', err);
        setError(err.message);
      }
    };

    initDB();
  }, []);

  const executeQuery = async (sql, params = []) => {
    try {
      console.log('[useMobileDB] Выполнение запроса:', sql, params);
      if (!isInitialized) {
        throw new Error('База данных не инициализирована');
      }
      const result = await db.query(sql, params);
      console.log('[useMobileDB] Запрос выполнен успешно, результат:', result);
      return result;
    } catch (err) {
      console.error('[useMobileDB] Ошибка выполнения запроса:', err);
      throw err;
    }
  };

  const executeRun = async (sql, params = []) => {
    try {
      console.log('[useMobileDB] Выполнение команды:', sql, params);
      if (!isInitialized) {
        throw new Error('База данных не инициализирована');
      }
      const result = await db.execute(sql, params);
      console.log('[useMobileDB] Команда выполнена успешно, результат:', result);
      return result;
    } catch (err) {
      console.error('[useMobileDB] Ошибка выполнения команды:', err);
      throw err;
    }
  };

  const executeInsert = async (sql, params = []) => {
    try {
      console.log('[useMobileDB] Выполнение вставки:', sql, params);
      if (!isInitialized) {
        throw new Error('База данных не инициализирована');
      }
      const result = await db.insert(sql, params);
      console.log('[useMobileDB] Вставка выполнена успешно, результат:', result);
      return result;
    } catch (err) {
      console.error('[useMobileDB] Ошибка выполнения вставки:', err);
      throw err;
    }
  };

  return {
    isInitialized,
    error,
    query: executeQuery,
    run: executeRun,
    insert: executeInsert
  };
};