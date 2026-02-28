// src/hooks/useShifts.js - Shifts hook
import { useState, useCallback } from 'react';
import { db } from '../db';

export const useShifts = (currentCashier, onPrintShiftReport) => {
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [shiftActualCash, setShiftActualCash] = useState('');

  // Обновление списка смен
  const refreshShifts = useCallback(async () => {
    try {
      console.log('[useShifts] Обновление смен...');
      
      // Загружаем смены из локальной БД
      const shifts = await db.getShifts();
      console.log('[useShifts] Смены загружены:', shifts);
      setShiftHistory(shifts);

      if (currentCashier) {
        // Ищем открытую смену для текущего кассира
        const openShift = await db.getOpenShift(currentCashier);
        console.log('[useShifts] Открытая смена:', openShift);
        
        if (openShift) {
          setIsShiftOpen(true);
          setCurrentShift(openShift);
        } else {
          setIsShiftOpen(false);
          setCurrentShift(null);
        }
      }
    } catch (error) {
      console.error('[useShifts] Ошибка обновления смен:', error);
    }
  }, [currentCashier]);

  // Открытие новой смены
  const handleOpenShift = async () => {
    if (isShiftOpen) {
      alert('Смена уже открыта!');
      return false;
    }
    
    if (!shiftActualCash || isNaN(parseFloat(shiftActualCash))) {
      alert('Введите корректную начальную сумму');
      return false;
    }

    try {
      const initialCash = parseFloat(shiftActualCash);
      const shift = await db.openShift(currentCashier, initialCash);
      
      setCurrentShift(shift);
      setIsShiftOpen(true);
      setShiftActualCash('');
      
      // Обновляем историю смен
      await refreshShifts();
      
      return true;
    } catch (error) {
      console.error('[useShifts] Ошибка открытия смены:', error);
      alert('Не удалось открыть смену: ' + error.message);
      return false;
    }
  };

  // Закрытие смены с расчётом отчёта
  const handleCloseShift = async (shiftData) => {
    const { actualCash, terminal, gas, salaries } = shiftData;
    
    if (!currentShift) {
      alert('Нет активной смены для закрытия');
      return false;
    }

    try {
      // Обновляем зарплатные настройки сотрудников при необходимости
      for (const sal of salaries) {
        if (sal.saveDefault && sal.id) {
          await db.updateEmployee(sal.id, { defaultSalary: sal.amount });
        }
      }

      // Загружаем все транзакции из БД
      const allTransactions = await db.getTransactions();
      
      // Фильтруем транзакции текущей смены
      const shiftTransactions = (allTransactions || []).filter(t => 
        t.timestamp > currentShift.openedAt && t.status !== 'CANCELLED'
      );
      
      // Считаем итоги
      let totalSalesCash = 0;
      let totalSalesTransfer = 0;
      let totalExpensesCash = 0;
      let totalExpensesTransfer = 0;
      let totalDiscounts = 0;
      let expensesByCategory = {};

      shiftTransactions.forEach(t => {
        if (t.type === 'SALE') {
          if (t.paymentMethod === 'CASH') {
            totalSalesCash += t.amount || 0;
          } else if (t.paymentMethod === 'TRANSFER') {
            totalSalesTransfer += t.amount || 0;
          }
          if (t.discount && t.originalAmount) {
            totalDiscounts += (t.originalAmount - t.amount);
          }
        } else if (t.type === 'EXPENSE') {
          if (t.expenseSource === 'CASH') {
            totalExpensesCash += t.amount || 0;
          } else if (t.expenseSource === 'TRANSFER') {
            totalExpensesTransfer += t.amount || 0;
          }
          
          // Группируем расходы по категориям
          const category = t.category || t.expenseCategory || 'Прочее';
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0;
          }
          expensesByCategory[category] += t.amount || 0;
        }
      });

      // Расчёт ожидаемой суммы в кассе
      const salaryTotal = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);
      const expectedCashInDrawer = 
        (currentShift.initialCash || 0) + 
        totalSalesCash - 
        (terminal || 0) - 
        (gas || 0) - 
        salaryTotal - 
        totalExpensesCash;
      
      const actualCashNum = parseFloat(actualCash) || 0;
      const difference = actualCashNum - expectedCashInDrawer;
      
      // Закрываем смену в БД
      await db.closeShift(currentShift.id, {
        expected: expectedCashInDrawer,
        actual: actualCashNum,
        difference: difference,
        totalSalesCash,
        totalSalesTransfer,
        totalExpensesCash,
        totalExpensesTransfer,
        totalDiscounts,
        terminal: terminal || 0,
        gas: gas || 0,
        salaries: salaries.map(s => ({ name: s.name, amount: s.amount || 0 }))
      });

      // Формируем текстовый отчёт
      const expensesList = Object.entries(expensesByCategory)
        .map(([category, amount]) => `${category}: ${amount} ₽`)
        .join('\n');

      const reportText = `
СМЕНА ЗАКРЫТА
━━━━━━━━━━━━━━━━
Кассир: ${currentCashier}
Дата: ${new Date().toLocaleDateString('ru-RU')}
Время: ${new Date().toLocaleTimeString('ru-RU')}

💰 НАЧАЛЬНАЯ СУММА: ${currentShift.initialCash || 0} ₽

📈 ПРОДАЖИ:
   Наличными: ${totalSalesCash} ₽
   Переводом: ${totalSalesTransfer} ₽
   Скидки: ${totalDiscounts} ₽

💸 РАСХОДЫ:
   Наличными: ${totalExpensesCash} ₽
   Переводом: ${totalExpensesTransfer} ₽
   Терминал: ${terminal || 0} ₽
   Бензин: ${gas || 0} ₽
   Зарплата: ${salaryTotal} ₽

📊 ПО КАТЕГОРИЯМ:
${expensesList || '   Нет расходов'}

🧮 ИТОГО:
   Ожидалось: ${expectedCashInDrawer.toFixed(2)} ₽
   Фактически: ${actualCashNum.toFixed(2)} ₽
   Разница: ${difference.toFixed(2)} ₽
   ${difference === 0 ? '✅ БЕЗ РАСХОЖДЕНИЙ' : 
     (difference > 0 ? '⚠️ ИЗЛИШЕК' : '❌ НЕДОСТАЧА')}
━━━━━━━━━━━━━━━━
`;

      // Показываем отчёт
      alert(reportText);

      // Передаём данные для печати (если есть обработчик)
      if (onPrintShiftReport) {
        onPrintShiftReport({
          cashier: currentCashier,
          date: new Date().toLocaleDateString('ru-RU'),
          time: new Date().toLocaleTimeString('ru-RU'),
          initialCash: currentShift.initialCash || 0,
          totalSalesCash,
          totalSalesTransfer,
          totalExpensesCash,
          totalExpensesTransfer,
          totalDiscounts,
          terminal: terminal || 0,
          gas: gas || 0,
          salaries: salaries.map(s => ({ name: s.name, amount: s.amount || 0 })),
          expensesByCategory,
          expectedCashInDrawer,
          actualCash: actualCashNum,
          difference
        });
      }

      // Обновляем состояние
      setIsShiftOpen(false);
      setCurrentShift(null);
      await refreshShifts();
      
      return true;
    } catch (error) {
      console.error('[useShifts] Ошибка закрытия смены:', error);
      alert('Не удалось закрыть смену: ' + error.message);
      return false;
    }
  };

  return {
    isShiftOpen,
    setIsShiftOpen,
    currentShift,
    setCurrentShift,
    shiftHistory,
    shiftActualCash,
    setShiftActualCash,
    refreshShifts,
    handleOpenShift,
    handleCloseShift
  };
};