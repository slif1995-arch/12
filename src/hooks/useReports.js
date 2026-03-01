// src/hooks/useReports.js - Reports hook
import { useState, useCallback } from 'react';
import { OrderService, ShiftService, ExpenseService } from '../services/api';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReportDate, setSelectedReportDate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const loadReportsList = useCallback(async () => {
    try {
      console.log('[useReports] Загрузка списка отчетов...');
      const shifts = await ShiftService.getAll();
      console.log('[useReports] Смены загружены:', shifts);
      // Возвращаем уникальные даты смен
      const dates = [...new Set(shifts.map(shift => new Date(shift.start_time).toLocaleDateString('ru-RU')))];
      setReports(dates);
    } catch (error) {
      console.error('[useReports] Ошибка загрузки списка отчетов:', error);
    }
  }, []);

  const viewReport = useCallback(async (date) => {
    const shifts = await ShiftService.getAll();
    // Находим смены за выбранную дату
    const shiftsForDate = shifts.filter(shift => 
      new Date(shift.start_time).toLocaleDateString('ru-RU') === date
    );
    
    if (shiftsForDate.length > 0) {
      // Загружаем заказы и расходы для этих смен
      let allOrders = [];
      let allExpenses = [];
      
      for (const shift of shiftsForDate) {
        const orders = await OrderService.getByShift(shift.id);
        const expenses = await ExpenseService.getByShift(shift.id);
        allOrders = allOrders.concat(orders);
        allExpenses = allExpenses.concat(expenses);
      }
      
      setReportData({
        shifts: shiftsForDate,
        orders: allOrders,
        expenses: allExpenses,
        date: date
      });
    }
    
    setSelectedReportDate(date);
  }, []);

  const calculateStats = useCallback((reportData) => {
    if (!reportData) return null;
    
    let incomeCash = 0;
    let incomeCard = 0;
    let expenseCash = 0;
    let expenseTransfer = 0;
    let totalSales = 0;
    let totalExpenses = 0;

    // Подсчет доходов из заказов
    reportData.orders.forEach(order => {
      if (order.status === 'paid') {
        totalSales += order.total_amount;
        if (order.payment_type === 'cash') {
          incomeCash += order.total_amount;
        } else if (order.payment_type === 'transfer') {
          incomeCard += order.total_amount;
        }
      }
    });

    // Подсчет расходов
    reportData.expenses.forEach(expense => {
      totalExpenses += expense.amount;
      if (expense.payment_type === 'cash') {
        expenseCash += expense.amount;
      } else if (expense.payment_type === 'transfer') {
        expenseTransfer += expense.amount;
      }
    });

    const cashInDrawer = incomeCash - expenseCash;

    return { 
      incomeCash, 
      incomeCard, 
      expenseCash, 
      expenseTransfer, 
      cashInDrawer,
      totalSales,
      totalExpenses
    };
  }, []);

  const refreshHistory = useCallback(async () => {
    const shifts = await ShiftService.getAll();
    setOrderHistory(shifts);
  }, []);

  return {
    reports,
    selectedReportDate,
    reportData,
    orderHistory,
    loadReportsList,
    viewReport,
    calculateStats,
    refreshHistory
  };
};