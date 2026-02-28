// src/services/api.js - Mobile API service
import { db } from '../db';

class ProductService {
  static async getAll() {
    console.log('[ProductService] Загрузка всех товаров...');
    const products = await db.getProducts();
    console.log('[ProductService] Товары загружены:', products);
    return products;
  }

  static async add(product) {
    console.log('[ProductService] Добавление товара:', product);
    const newProduct = await db.addProduct(product);
    console.log('[ProductService] Товар добавлен:', newProduct);
    return newProduct;
  }

  static async update(id, updates) {
    console.log('[ProductService] Обновление товара:', id, updates);
    const updated = await db.updateProduct(id, updates);
    console.log('[ProductService] Товар обновлен:', updated);
    return updated;
  }

  static async delete(id) {
    console.log('[ProductService] Удаление товара:', id);
    await db.deleteProduct(id);
    console.log('[ProductService] Товар удален');
  }
}

class ShiftService {
  static async getRecentShifts() {
    console.log('[ShiftService] Загрузка смен...');
    const shifts = await db.getShifts();
    console.log('[ShiftService] Смены загружены:', shifts);
    return shifts;
  }

  static async getOpenShift(cashier) {
    console.log('[ShiftService] Поиск открытой смены для:', cashier);
    const shift = await db.getOpenShift(cashier);
    console.log('[ShiftService] Открытая смена:', shift);
    return shift;
  }

  static async openShift(cashier, initialCash) {
    console.log('[ShiftService] Открытие смены:', cashier, initialCash);
    const shift = await db.openShift(cashier, initialCash);
    console.log('[ShiftService] Смена открыта:', shift);
    return shift;
  }

  static async closeShift(shiftId, data) {
    console.log('[ShiftService] Закрытие смены:', shiftId, data);
    await db.closeShift(shiftId, data);
    console.log('[ShiftService] Смена закрыта');
  }
}

class TransactionService {
  static async getAvailableDates() {
    console.log('[TransactionService] Получение доступных дат...');
    const transactions = await db.getTransactions();
    const dates = [...new Set(transactions.map(t => t.timestamp.split('T')[0]))];
    console.log('[TransactionService] Доступные даты:', dates);
    return dates;
  }

  static async getRecentSales() {
    console.log('[TransactionService] Получение последних продаж...');
    const transactions = await db.getTransactions();
    console.log('[TransactionService] Продажи загружены:', transactions);
    return transactions;
  }

  static async addTransaction(transaction) {
    console.log('[TransactionService] Добавление транзакции:', transaction);
    const newTransaction = await db.addTransaction(transaction);
    console.log('[TransactionService] Транзакция добавлена:', newTransaction);
    return newTransaction;
  }
}

export { ProductService, ShiftService, TransactionService };