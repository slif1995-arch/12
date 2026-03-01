// src/services/api.js - Mobile API service
import { db } from '../db';

class ProductService {
  static async getAll() {
    console.log('[ProductService] Загрузка всех товаров...');
    const products = await db.getProducts();
    console.log('[ProductService] Товары загружены:', products);
    return products;
  }

  static async getById(id) {
    console.log('[ProductService] Загрузка товара по ID:', id);
    const product = await db.getProductById(id);
    console.log('[ProductService] Товар загружен:', product);
    return product;
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

class CategoryService {
  static async getAll() {
    console.log('[CategoryService] Загрузка всех категорий...');
    const categories = await db.getCategories();
    console.log('[CategoryService] Категории загружены:', categories);
    return categories;
  }

  static async add(category) {
    console.log('[CategoryService] Добавление категории:', category);
    const newCategory = await db.addCategory(category);
    console.log('[CategoryService] Категория добавлена:', newCategory);
    return newCategory;
  }

  static async update(id, name) {
    console.log('[CategoryService] Обновление категории:', id, name);
    await db.updateCategory(id, name);
    console.log('[CategoryService] Категория обновлена');
  }

  static async delete(id) {
    console.log('[CategoryService] Удаление категории:', id);
    await db.deleteCategory(id);
    console.log('[CategoryService] Категория удалена');
  }
}

class OrderService {
  static async getAll() {
    console.log('[OrderService] Загрузка всех заказов...');
    const orders = await db.getOrders();
    console.log('[OrderService] Заказы загружены:', orders);
    return orders;
  }

  static async getByShift(shiftId) {
    console.log('[OrderService] Загрузка заказов по смене:', shiftId);
    const orders = await db.getOrdersByShift(shiftId);
    console.log('[OrderService] Заказы загружены:', orders);
    return orders;
  }

  static async getById(id) {
    console.log('[OrderService] Загрузка заказа по ID:', id);
    const order = await db.getOrderById(id);
    console.log('[OrderService] Заказ загружен:', order);
    return order;
  }

  static async create(orderData) {
    console.log('[OrderService] Создание заказа:', orderData);
    const newOrder = await db.createOrder(orderData);
    console.log('[OrderService] Заказ создан:', newOrder);
    return newOrder;
  }

  static async update(id, updates) {
    console.log('[OrderService] Обновление заказа:', id, updates);
    const updated = await db.updateOrder(id, updates);
    console.log('[OrderService] Заказ обновлен:', updated);
    return updated;
  }

  static async delete(id) {
    console.log('[OrderService] Удаление заказа:', id);
    await db.deleteOrder(id);
    console.log('[OrderService] Заказ удален');
  }
}

class ShiftService {
  static async getAll() {
    console.log('[ShiftService] Загрузка всех смен...');
    const shifts = await db.getShifts();
    console.log('[ShiftService] Смены загружены:', shifts);
    return shifts;
  }

  static async getById(id) {
    console.log('[ShiftService] Загрузка смены по ID:', id);
    const shift = await db.getShiftById(id);
    console.log('[ShiftService] Смена загружена:', shift);
    return shift;
  }

  static async getOpenShifts() {
    console.log('[ShiftService] Загрузка открытых смен...');
    const shifts = await db.getOpenShifts();
    console.log('[ShiftService] Открытые смены загружены:', shifts);
    return shifts;
  }

  static async getOpenShiftForEmployee(employeeId) {
    console.log('[ShiftService] Поиск открытой смены для сотрудника:', employeeId);
    const shift = await db.getOpenShiftForEmployee(employeeId);
    console.log('[ShiftService] Открытая смена:', shift);
    return shift;
  }

  static async create(shiftData) {
    console.log('[ShiftService] Создание смены:', shiftData);
    const newShift = await db.createShift(shiftData);
    console.log('[ShiftService] Смена создана:', newShift);
    return newShift;
  }

  static async close(shiftId, data) {
    console.log('[ShiftService] Закрытие смены:', shiftId, data);
    await db.closeShift(shiftId, data);
    console.log('[ShiftService] Смена закрыта');
  }
}

class EmployeeService {
  static async getAll() {
    console.log('[EmployeeService] Загрузка всех сотрудников...');
    const employees = await db.getEmployees();
    console.log('[EmployeeService] Сотрудники загружены:', employees);
    return employees;
  }

  static async getById(id) {
    console.log('[EmployeeService] Загрузка сотрудника по ID:', id);
    const employee = await db.getEmployeeById(id);
    console.log('[EmployeeService] Сотрудник загружен:', employee);
    return employee;
  }

  static async add(employee) {
    console.log('[EmployeeService] Добавление сотрудника:', employee);
    const newEmployee = await db.addEmployee(employee);
    console.log('[EmployeeService] Сотрудник добавлен:', newEmployee);
    return newEmployee;
  }

  static async update(id, updates) {
    console.log('[EmployeeService] Обновление сотрудника:', id, updates);
    const updated = await db.updateEmployee(id, updates);
    console.log('[EmployeeService] Сотрудник обновлен:', updated);
    return updated;
  }

  static async delete(id) {
    console.log('[EmployeeService] Удаление сотрудника:', id);
    await db.deleteEmployee(id);
    console.log('[EmployeeService] Сотрудник удален');
  }
}

class ExpenseService {
  static async getByShift(shiftId) {
    console.log('[ExpenseService] Загрузка расходов по смене:', shiftId);
    const expenses = await db.getExpensesByShift(shiftId);
    console.log('[ExpenseService] Расходы загружены:', expenses);
    return expenses;
  }

  static async add(expenseData) {
    console.log('[ExpenseService] Добавление расхода:', expenseData);
    const newExpenseId = await db.addExpense(expenseData);
    console.log('[ExpenseService] Расход добавлен:', newExpenseId);
    return newExpenseId;
  }
}

class ExpenseTypeService {
  static async getAll() {
    console.log('[ExpenseTypeService] Загрузка всех типов расходов...');
    const expenseTypes = await db.getExpenseTypes();
    console.log('[ExpenseTypeService] Типы расходов загружены:', expenseTypes);
    return expenseTypes;
  }

  static async add(name) {
    console.log('[ExpenseTypeService] Добавление типа расхода:', name);
    const newExpenseType = await db.addExpenseType(name);
    console.log('[ExpenseTypeService] Тип расхода добавлен:', newExpenseType);
    return newExpenseType;
  }

  static async update(id, name) {
    console.log('[ExpenseTypeService] Обновление типа расхода:', id, name);
    await db.updateExpenseType(id, name);
    console.log('[ExpenseTypeService] Тип расхода обновлен');
  }

  static async delete(id) {
    console.log('[ExpenseTypeService] Удаление типа расхода:', id);
    await db.deleteExpenseType(id);
    console.log('[ExpenseTypeService] Тип расхода удален');
  }
}

export { 
  ProductService, 
  CategoryService,
  OrderService, 
  ShiftService, 
  EmployeeService,
  ExpenseService,
  ExpenseTypeService
};