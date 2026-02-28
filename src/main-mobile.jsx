// src/main-mobile.jsx - Mobile entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import AppMobile from './AppMobile';
import { db } from './db';  // ✅ Импортируем БД
import './index.css';

console.log('[main-mobile] Запуск мобильного приложения...');

// ✅ Инициализируем БД до рендера
const initApp = async () => {
  try {
    await db.init();
    console.log('[main-mobile] База данных инициализирована');
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <AppMobile />  {/* ✅ Рендерим приложение */}
      </React.StrictMode>
    );
    console.log('[main-mobile] Приложение запущено');
  } catch (error) {
    console.error('[main-mobile] Критическая ошибка инициализации:', error);
    document.getElementById('root').innerHTML = `
      <div style="padding:20px;color:red">
        <h2>Ошибка запуска</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Повторить</button>
      </div>
    `;
  }
};

initApp();