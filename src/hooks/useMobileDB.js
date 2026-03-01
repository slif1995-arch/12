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

  return {
    isInitialized,
    error,
    db // Return the db instance directly since it has all the methods
  };
};