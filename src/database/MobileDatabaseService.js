// src/database/MobileDatabaseService.js
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Preferences } from '@capacitor/preferences';
import { schema } from './schema';

const DB_NAME = 'sushi_pos.db';

class MobileDatabaseService {
  constructor() {
    this.isDbInitialized = false;
    this.isDbOpen = false;
  }

  async init() {
    console.log('[MobileDatabaseService] Initializing database...');
    
    try {
      // Initialize SQLite database
      await this.initializeSQLite();
      
      // Check if we have existing data in Preferences that needs migration
      await this.migrateFromPreferencesIfNeeded();
      
      this.isDbInitialized = true;
      console.log('[MobileDatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[MobileDatabaseService] Error initializing database:', error);
      throw error;
    }
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
      await this.openDatabase();

      // Execute schema
      await CapacitorSQLite.execute({
        database: DB_NAME,
        statements: schema
      });

      // Insert default employee if none exist
      await this.insertDefaultEmployees();
      
      // Insert default expense types if none exist
      await this.insertDefaultExpenseTypes();

      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  }

  async openDatabase() {
    if (!this.isDbOpen) {
      await CapacitorSQLite.open({ database: DB_NAME });
      this.isDbOpen = true;
    }
  }

  async closeDatabase() {
    if (this.isDbOpen) {
      await CapacitorSQLite.close({ database: DB_NAME });
      this.isDbOpen = false;
    }
  }

  async migrateFromPreferencesIfNeeded() {
    // Check if we have data in preferences that hasn't been migrated yet
    const prefsData = await Preferences.get({ key: 'migration_status' });
    if (prefsData.value) return; // Already migrated
    
    // Migrate any existing data from preferences to SQLite
    // This is important for backward compatibility
    console.log('[MobileDatabaseService] Checking for data to migrate...');
    
    // Mark migration as complete
    await Preferences.set({
      key: 'migration_status',
      value: JSON.stringify({ completed: true, timestamp: new Date().toISOString() })
    });
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

  // Products methods
  async getProducts() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name',
      values: []
    });
    return result.values || [];
  }

  async getProductById(id) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      values: [id]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async addProduct(product) {
    await this.openDatabase();
    
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        INSERT INTO products (name, price, category_id, subcategory_id) 
        VALUES (?, ?, ?, ?)
      `,
      values: [
        product.name, 
        product.price, 
        product.category_id || null, 
        product.subcategory_id || null
      ]
    });
    
    // Return the newly created product
    return await this.getProductById(result.changes.lastId);
  }

  async updateProduct(id, updates) {
    await this.openDatabase();
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id); // Add ID to the end for WHERE clause
    
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `
        UPDATE products 
        SET ${setClause}
        WHERE id = ?
      `,
      values: values
    });
    
    return await this.getProductById(id);
  }

  async deleteProduct(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'DELETE FROM products WHERE id = ?',
      values: [id]
    });
  }

  // Categories methods
  async getCategories() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM categories ORDER BY name',
      values: []
    });
    return result.values || [];
  }

  async addCategory(category) {
    await this.openDatabase();
    
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'INSERT INTO categories (name) VALUES (?)',
      values: [category.name]
    });
    
    return { id: result.changes.lastId, name: category.name };
  }

  async updateCategory(id, name) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'UPDATE categories SET name = ? WHERE id = ?',
      values: [name, id]
    });
  }

  async deleteCategory(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'DELETE FROM products WHERE category_id = ?; DELETE FROM categories WHERE id = ?',
      values: [id, id]
    });
  }

  // Orders methods
  async getOrders() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT o.*, s.id as shift_id, s.start_time as shift_start_time 
        FROM orders o 
        LEFT JOIN shifts s ON o.shift_id = s.id 
        ORDER BY o.timestamp DESC
      `,
      values: []
    });
    return result.values || [];
  }

  async getOrdersByShift(shiftId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM orders WHERE shift_id = ? ORDER BY timestamp DESC',
      values: [shiftId]
    });
    return result.values || [];
  }

  async getOrderById(id) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM orders WHERE id = ?',
      values: [id]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async createOrder(orderData) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        INSERT INTO orders (shift_id, order_type, payment_type, discount, total_amount, status, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        orderData.shift_id,
        orderData.order_type || 'delivery',
        orderData.payment_type || 'cash',
        orderData.discount || 0,
        orderData.total_amount || 0,
        orderData.status || 'pending',
        now
      ]
    });
    
    return await this.getOrderById(result.changes.lastId);
  }

  async updateOrder(id, updates) {
    await this.openDatabase();
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id); // Add ID to the end for WHERE clause
    
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `
        UPDATE orders 
        SET ${setClause}
        WHERE id = ?
      `,
      values: values
    });
    
    return await this.getOrderById(id);
  }

  async deleteOrder(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'DELETE FROM orders WHERE id = ?',
      values: [id]
    });
  }

  // Shifts methods
  async getShifts() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT s.*, e.name as employee_name 
        FROM shifts s 
        LEFT JOIN employees e ON s.employee_id = e.id 
        ORDER BY s.start_time DESC
      `,
      values: []
    });
    return result.values || [];
  }

  async getShiftById(id) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT s.*, e.name as employee_name 
        FROM shifts s 
        LEFT JOIN employees e ON s.employee_id = e.id 
        WHERE s.id = ?
      `,
      values: [id]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async getOpenShifts() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT s.*, e.name as employee_name 
        FROM shifts s 
        LEFT JOIN employees e ON s.employee_id = e.id 
        WHERE s.status = 'open' 
        ORDER BY s.start_time DESC
      `,
      values: []
    });
    return result.values || [];
  }

  async getOpenShiftForEmployee(employeeId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT s.*, e.name as employee_name 
        FROM shifts s 
        LEFT JOIN employees e ON s.employee_id = e.id 
        WHERE s.employee_id = ? AND s.status = 'open' 
        ORDER BY s.start_time DESC 
        LIMIT 1
      `,
      values: [employeeId]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async createShift(shiftData) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        INSERT INTO shifts (employee_id, start_time, initial_amount, status) 
        VALUES (?, ?, ?, 'open')
      `,
      values: [shiftData.employee_id, now, shiftData.initial_amount || 0]
    });
    
    return await this.getShiftById(result.changes.lastId);
  }

  async closeShift(id, data) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `
        UPDATE shifts 
        SET end_time = ?, 
            final_amount = ?,
            remaining_balance = ?,
            terminal_balance = ?,
            fuel_expense = ?,
            cash_balance = ?,
            salary_payments = ?,
            cash_expenses = ?,
            transfer_expenses = ?,
            total_revenue = ?,
            card_revenue = ?,
            status = 'closed' 
        WHERE id = ?
      `,
      values: [
        now, 
        data.final_amount,
        data.remaining_balance,
        data.terminal_balance,
        data.fuel_expense,
        data.cash_balance,
        data.salary_payments,
        data.cash_expenses,
        data.transfer_expenses,
        data.total_revenue,
        data.card_revenue,
        id
      ]
    });
  }

  // Employees methods
  async getEmployees() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM employees WHERE active = 1 ORDER BY name',
      values: []
    });
    return result.values || [];
  }

  async getEmployeeById(id) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM employees WHERE id = ?',
      values: [id]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async addEmployee(employee) {
    await this.openDatabase();
    
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        INSERT INTO employees (name, position, active) 
        VALUES (?, ?, ?)
      `,
      values: [employee.name, employee.position || 'cashier', employee.active !== undefined ? employee.active : 1]
    });
    
    return await this.getEmployeeById(result.changes.lastId);
  }

  async updateEmployee(id, updates) {
    await this.openDatabase();
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id); // Add ID to the end for WHERE clause
    
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `
        UPDATE employees 
        SET ${setClause}
        WHERE id = ?
      `,
      values: values
    });
    
    return await this.getEmployeeById(id);
  }

  async deleteEmployee(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'UPDATE employees SET active = 0 WHERE id = ?',
      values: [id]
    });
  }

  // Expenses methods
  async getExpensesByShift(shiftId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        SELECT e.*, et.name as expense_type_name
        FROM expenses e
        JOIN expense_types et ON e.expense_type_id = et.id
        WHERE e.shift_id = ?
        ORDER BY e.timestamp DESC
      `,
      values: [shiftId]
    });
    return result.values || [];
  }

  async addExpense(expenseData) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `
        INSERT INTO expenses (shift_id, expense_type_id, amount, payment_type, comment, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [
        expenseData.shift_id,
        expenseData.expense_type_id,
        expenseData.amount,
        expenseData.payment_type || 'cash',
        expenseData.comment || '',
        now
      ]
    });
    
    return result.changes.lastId;
  }

  // Expense Types methods
  async getExpenseTypes() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT * FROM expense_types ORDER BY name',
      values: []
    });
    return result.values || [];
  }

  async addExpenseType(name) {
    await this.openDatabase();
    
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'INSERT INTO expense_types (name) VALUES (?)',
      values: [name]
    });
    
    return { id: result.changes.lastId, name };
  }

  async updateExpenseType(id, name) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'UPDATE expense_types SET name = ? WHERE id = ?',
      values: [name, id]
    });
  }

  async deleteExpenseType(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: 'DELETE FROM expense_types WHERE id = ?',
      values: [id]
    });
  }
}

export default new MobileDatabaseService();