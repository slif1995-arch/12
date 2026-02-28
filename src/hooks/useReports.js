// src/hooks/useReports.js - Reports hook
import { useState, useCallback } from 'react';
import { TransactionService } from '../services/api';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [selectedReportDate, setSelectedReportDate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  const loadReportsList = useCallback(async () => {
    try {
      console.log('[useReports] Загрузка списка отчетов...');
      const dates = await TransactionService.getAvailableDates();
      console.log('[useReports] Даты загружены:', dates);
      setReports(dates);
    } catch (error) {
      console.error('[useReports] Ошибка загрузки списка отчетов:', error);
    }
  }, []);

  const viewReport = useCallback(async (date) => {
    const data = await TransactionService.getRecentSales();
    setReportData(data);
    setSelectedReportDate(date);
  }, []);

  const calculateStats = useCallback((data) => {
    if (!data) return null;
    let incomeCash = 0, incomeCard = 0, expenseCash = 0, expenseTransfer = 0;

    data.forEach(t => {
      if (t.status === 'CANCELLED') return;
      if (t.type === 'SALE') {
        if (t.paymentMethod === 'CASH') incomeCash += t.amount;
        else incomeCard += t.amount;
      } else {
        if (t.expenseSource === 'CASH') expenseCash += t.amount;
        else expenseTransfer += t.amount;
      }
    });

    return { incomeCash, incomeCard, expenseCash, expenseTransfer, cashInDrawer: incomeCash - expenseCash };
  }, []);

  const refreshHistory = useCallback(async () => {
    const recentSales = await TransactionService.getRecentSales();
    setOrderHistory(recentSales);
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