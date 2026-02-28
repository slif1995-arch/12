// src/db/index.js - Mobile database service
import { Preferences } from '@capacitor/preferences';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { schema } from '../database/schema';

const STORAGE_KEYS = {
  PRODUCTS: 'sushi_products',
  CATEGORIES: 'sushi_categories',
  ORDERS: 'sushi_orders',
  CURRENT_ORDER: 'sushi_current_order',
  SHIFTS: 'sushi_shifts',
  TRANSACTIONS: 'sushi_transactions',
  EMPLOYEES: 'sushi_employees'
};

const DB_NAME = 'sushi_pos.db';

class MobileDB {
  constructor() {
    this.isDbInitialized = false;
  }

  async init() {
    console.log('[MobileDB] Инициализация базы данных...');
    
    // Инициализируем SQLite базу данных
    await this.initializeSQLite();
    
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

  async initializeSQLite() {
    try {
      // Create database connection
      await CapacitorSQLite.createConnection({
        database: DB_NAME,
        version: 1,
        encrypted: false,
        mode: 'no-encryption'
      });

      // Open database
      await CapacitorSQLite.open({ database: DB_NAME });

      // Execute schema
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: schema
      });

      // Insert default employee if none exist
      await this.insertDefaultEmployees();
      
      // Insert default expense types if none exist
      await this.insertDefaultExpenseTypes();

      this.isDbInitialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  async insertDefaultEmployees() {
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT COUNT(*) as count FROM employees',
      values: []
    });

    if (result.values && result.values.length > 0 && result.values[0].count === 0) {
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: `
          INSERT INTO employees (name, position, active) VALUES 
          ('Кассир 1', 'cashier', 1),
          ('Кассир 2', 'cashier', 1),
          ('Администратор', 'admin', 1)
        `
      });
    }
  }

  async insertDefaultExpenseTypes() {
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT COUNT(*) as count FROM expense_types',
      values: []
    });

    if (result.values && result.values.length > 0 && result.values[0].count === 0) {
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: `
          INSERT INTO expense_types (name) VALUES 
          ('Продукты'),
          ('Упаковка'),
          ('Коммунальные услуги'),
          ('Расходы на транспорт'),
          ('Прочие расходы')
        `
      });
    }
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
    if (this.isDbInitialized) {
      // Используем SQLite базу данных
      const result = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: `
          SELECT s.*, e.name as cashier_name 
          FROM shifts s 
          JOIN employees e ON s.employee_id = e.id 
          WHERE e.name = ? AND s.status = 'open' 
          ORDER BY s.start_time DESC 
          LIMIT 1
        `,
        values: [cashier]
      });
      return result.values && result.values.length > 0 ? result.values[0] : null;
    } else {
      // Используем Preferences для обратной совместимости
      const shifts = await this.getShifts();
      return shifts.find(s => s.cashier === cashier && !s.closedAt);
    }
  }

  async openShift(cashier, initialCash) {
    if (this.isDbInitialized) {
      // Получаем ID сотрудника по имени
      const employeeResult = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: 'SELECT id FROM employees WHERE name = ?',
        values: [cashier]
      });
      
      if (employeeResult.values && employeeResult.values.length > 0) {
        const employeeId = employeeResult.values[0].id;
        
        const now = new Date().toISOString();
        const result = await CapacitorSQLite.query({
          database: DB_NAME,
          statement: `
            INSERT INTO shifts (employee_id, start_time, initial_amount, status) 
            VALUES (?, ?, ?, 'open')
          `,
          values: [employeeId, now, initialCash]
        });
        
        // Возвращаем созданную смену
        const shiftResult = await CapacitorSQLite.query({
          database: DB_NAME,
          statement: `
            SELECT s.*, e.name as cashier_name 
            FROM shifts s 
            JOIN employees e ON s.employee_id = e.id 
            WHERE s.id = ?
          `,
          values: [result.changes.lastId]
        });
        
        return shiftResult.values && shiftResult.values.length > 0 ? shiftResult.values[0] : null;
      } else {
        throw new Error('Employee not found');
      }
    } else {
      // Используем Preferences для обратной совместимости
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
  }

  async closeShift(shiftId, data) {
    if (this.isDbInitialized) {
      // Обновляем смену в SQLite базе данных
      const now = new Date().toISOString();
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: `
          UPDATE shifts 
          SET end_time = ?, final_amount = ?, status = 'closed' 
          WHERE id = ?
        `,
        values: [now, data.actual, shiftId]
      });
    } else {
      // Используем Preferences для обратной совместимости
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

  async getEmployees() {
    if (this.isDbInitialized) {
      // Используем SQLite базу данных
      const result = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: 'SELECT * FROM employees WHERE active = 1 ORDER BY name',
        values: []
      });
      return result.values || [];
    } else {
      // Используем Preferences для обратной совместимости
      const { value } = await Preferences.get({ key: STORAGE_KEYS.EMPLOYEES });
      return value ? JSON.parse(value) : [];
    }
  }

  async setEmployees(employees) {
    if (this.isDbInitialized) {
      // Обновляем только в Preferences для обратной совместимости
      await Preferences.set({
        key: STORAGE_KEYS.EMPLOYEES,
        value: JSON.stringify(employees)
      });
    } else {
      await Preferences.set({
        key: STORAGE_KEYS.EMPLOYEES,
        value: JSON.stringify(employees)
      });
    }
  }

  async addEmployee(employee) {
    if (this.isDbInitialized) {
      // Добавляем в SQLite базу данных
      const now = new Date().toISOString();
      const result = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: `
          INSERT INTO employees (name, position, active) 
          VALUES (?, ?, ?)
        `,
        values: [employee.name, employee.position || 'cashier', employee.active !== undefined ? employee.active : true]
      });
      
      // Возвращаем добавленного сотрудника
      const newEmployee = {
        id: result.changes.lastId,
        ...employee,
        createdAt: now
      };
      
      return newEmployee;
    } else {
      // Используем Preferences для обратной совместимости
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
  }

  async updateEmployee(id, updates) {
    if (this.isDbInitialized) {
      // Обновляем в SQLite базе данных
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      values.push(id); // ID добавляем в конец для WHERE
      
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: `
          UPDATE employees 
          SET ${setClause}
          WHERE id = ?
        `,
        values: values
      });
      
      // Возвращаем обновленного сотрудника
      const result = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: 'SELECT * FROM employees WHERE id = ?',
        values: [id]
      });
      
      return result.values && result.values.length > 0 ? result.values[0] : null;
    } else {
      // Используем Preferences для обратной совместимости
      const employees = await this.getEmployees();
      const index = employees.findIndex(e => e.id === id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...updates };
        await this.setEmployees(employees);
        return employees[index];
      }
      return null;
    }
  }

  async deleteEmployee(id) {
    if (this.isDbInitialized) {
      // Удаляем из SQLite базы данных
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: 'DELETE FROM employees WHERE id = ?',
        values: [id]
      });
    } else {
      // Используем Preferences для обратной совместимости
      const employees = await this.getEmployees();
      const filtered = employees.filter(e => e.id !== id);
      await this.setEmployees(filtered);
    }
  }

  async getActiveCashiers() {
    if (this.isDbInitialized) {
      // Используем SQLite базу данных
      const result = await CapacitorSQLite.query({
        database: DB_NAME,
        statement: 'SELECT * FROM employees WHERE active = 1 AND position = "cashier" ORDER BY name',
        values: []
      });
      return result.values || [];
    } else {
      // Используем Preferences для обратной совместимости
      const employees = await this.getEmployees();
      return employees.filter(e => e.active && e.position === 'Кассир');
    }
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