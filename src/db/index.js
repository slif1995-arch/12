// src/db/index.js - Mobile database service
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEYS = {
  PRODUCTS: 'sushi_products',
  CATEGORIES: 'sushi_categories',
  ORDERS: 'sushi_orders',
  CURRENT_ORDER: 'sushi_current_order',
  SHIFTS: 'sushi_shifts',
  TRANSACTIONS: 'sushi_transactions',
  EMPLOYEES: 'sushi_employees'
};

class MobileDB {
  async init() {
    console.log('[MobileDB] Инициализация базы данных...');
    // Проверяем, есть ли данные в localStorage
    const products = await this.getProducts();
    if (!products) {
      await this.setProducts([]);
    }
    const categories = await this.getCategories();
    if (!categories) {
      await this.setCategories([]);
    }
    const orders = await this.getOrders();
    if (!orders) {
      await this.setOrders([]);
    }
    const shifts = await this.getShifts();
    if (!shifts) {
      await this.setShifts([]);
    }
    const transactions = await this.getTransactions();
    if (!transactions) {
      await this.setTransactions([]);
    }
    
    // Проверяем, есть ли сотрудники, и добавляем тестовых если нет
    const employees = await this.getEmployees();
    if (!employees || employees.length === 0) {
      console.log('[MobileDB] Добавление тестовых кассиров...');
      await this.addEmployee({
        name: 'Иван Петров',
        position: 'Кассир',
        active: true
      });
      await this.addEmployee({
        name: 'Мария Сидорова',
        position: 'Кассир',
        active: true
      });
      console.log('[MobileDB] Тестовые кассиры добавлены');
    }
    
    console.log('[MobileDB] База данных инициализирована');
  }

  // Products
  async getProducts() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.PRODUCTS });
    return value ? JSON.parse(value) : [];
  }

  async setProducts(products) {
    await Preferences.set({
      key: STORAGE_KEYS.PRODUCTS,
      value: JSON.stringify(products)
    });
  }

  async addProduct(product) {
    const products = await this.getProducts();
    const newProduct = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    await this.setProducts(products);
    return newProduct;
  }

  async updateProduct(id, updates) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      await this.setProducts(products);
      return products[index];
    }
    return null;
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    await this.setProducts(filtered);
  }

  // Categories
  async getCategories() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.CATEGORIES });
    return value ? JSON.parse(value) : [];
  }

  async setCategories(categories) {
    await Preferences.set({
      key: STORAGE_KEYS.CATEGORIES,
      value: JSON.stringify(categories)
    });
  }

  // Orders
  async getOrders() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.ORDERS });
    return value ? JSON.parse(value) : [];
  }

  async setOrders(orders) {
    await Preferences.set({
      key: STORAGE_KEYS.ORDERS,
      value: JSON.stringify(orders)
    });
  }

  async getCurrentOrder() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.CURRENT_ORDER });
    return value ? JSON.parse(value) : null;
  }

  async setCurrentOrder(order) {
    await Preferences.set({
      key: STORAGE_KEYS.CURRENT_ORDER,
      value: JSON.stringify(order)
    });
  }

  async createOrder(category) {
    const order = {
      id: Date.now().toString(),
      category: category,
      items: [],
      createdAt: new Date().toISOString()
    };
    const orders = await this.getOrders();
    orders.push(order);
    await this.setOrders(orders);
    await this.setCurrentOrder(order);
    return order;
  }

  async updateOrderItems(orderId, items) {
    const orders = await this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.items = items;
      await this.setOrders(orders);
      await this.setCurrentOrder(order);
    }
  }

  async deleteOrder(orderId) {
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    await this.setOrders(filtered);
    
    // Если удаляем текущий заказ, удаляем его из текущего
    const currentOrder = await this.getCurrentOrder();
    if (currentOrder && currentOrder.id === orderId) {
      await this.setCurrentOrder(null);
    }
  }

  // Shifts
  async getShifts() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.SHIFTS });
    return value ? JSON.parse(value) : [];
  }

  async setShifts(shifts) {
    await Preferences.set({
      key: STORAGE_KEYS.SHIFTS,
      value: JSON.stringify(shifts)
    });
  }

  async getOpenShift(cashier) {
    const shifts = await this.getShifts();
    return shifts.find(s => s.cashier === cashier && !s.closedAt);
  }

  async openShift(cashier, initialCash) {
    const shift = {
      id: Date.now().toString(),
      cashier: cashier,
      initialCash: initialCash,
      openedAt: new Date().toISOString(),
      closedAt: null,
      expectedCash: null,
      actualCash: null,
      difference: null
    };
    const shifts = await this.getShifts();
    shifts.push(shift);
    await this.setShifts(shifts);
    return shift;
  }

  async closeShift(shiftId, data) {
    const shifts = await this.getShifts();
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      shift.closedAt = new Date().toISOString();
      shift.expectedCash = data.expected;
      shift.actualCash = data.actual;
      shift.difference = data.difference;
      await this.setShifts(shifts);
    }
  }

  // Transactions
  async getTransactions() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.TRANSACTIONS });
    return value ? JSON.parse(value) : [];
  }

  async setTransactions(transactions) {
    await Preferences.set({
      key: STORAGE_KEYS.TRANSACTIONS,
      value: JSON.stringify(transactions)
    });
  }

  async addTransaction(transaction) {
    const transactions = await this.getTransactions();
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    transactions.push(newTransaction);
    await this.setTransactions(transactions);
    return newTransaction;
  }

  // Employees
  async getEmployees() {
    const { value } = await Preferences.get({ key: STORAGE_KEYS.EMPLOYEES });
    return value ? JSON.parse(value) : [];
  }

  async setEmployees(employees) {
    await Preferences.set({
      key: STORAGE_KEYS.EMPLOYEES,
      value: JSON.stringify(employees)
    });
  }

  async addEmployee(employee) {
    const employees = await this.getEmployees();
    const newEmployee = {
      ...employee,
      id: Date.now().toString(),
      active: true,
      createdAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    await this.setEmployees(employees);
    return newEmployee;
  }

  async updateEmployee(id, updates) {
    const employees = await this.getEmployees();
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      employees[index] = { ...employees[index], ...updates };
      await this.setEmployees(employees);
      return employees[index];
    }
    return null;
  }

  async deleteEmployee(id) {
    const employees = await this.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    await this.setEmployees(filtered);
  }

  async getActiveCashiers() {
    const employees = await this.getEmployees();
    return employees.filter(e => e.active && e.position === 'Кассир');
  }

  // Settings (для совместимости)
  async getSetting(key) {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async setSetting(key, value) {
    await Preferences.set({ key, value });
  }
}

export const db = new MobileDB();