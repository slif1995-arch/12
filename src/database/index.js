import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { schema } from './schema';

class DatabaseService {
  constructor() {
    this.dbName = 'sushi_pos.db';
    this.isDbOpen = false;
  }

  async initializeDatabase() {
    try {
      // Create database connection
      await CapacitorSQLite.createConnection({
        database: this.dbName,
        version: 1,
        encrypted: false,
        mode: 'no-encryption'
      });

      // Open database
      await this.openDatabase();

      // Execute schema
      await CapacitorSQLite.execute({
        database: this.dbName,
        statements: schema
      });

      // Insert default employee if none exist
      await this.insertDefaultEmployees();
      
      // Insert default expense types if none exist
      await this.insertDefaultExpenseTypes();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async openDatabase() {
    if (!this.isDbOpen) {
      await CapacitorSQLite.open({ database: this.dbName });
      this.isDbOpen = true;
    }
  }

  async closeDatabase() {
    if (this.isDbOpen) {
      await CapacitorSQLite.close({ database: this.dbName });
      this.isDbOpen = false;
    }
  }

  async insertDefaultEmployees() {
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'SELECT COUNT(*) as count FROM employees',
      values: []
    });

    if (result.values && result.values.length > 0 && result.values[0].count === 0) {
      await CapacitorSQLite.execute({
        database: this.dbName,
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
      database: this.dbName,
      statement: 'SELECT COUNT(*) as count FROM expense_types',
      values: []
    });

    if (result.values && result.values.length > 0 && result.values[0].count === 0) {
      await CapacitorSQLite.execute({
        database: this.dbName,
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

  async getEmployees() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'SELECT * FROM employees WHERE active = 1 ORDER BY name',
      values: []
    });
    return result.values || [];
  }

  async getCurrentShift(employeeId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'SELECT * FROM shifts WHERE employee_id = ? AND status = "open" ORDER BY start_time DESC LIMIT 1',
      values: [employeeId]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async createShift(employeeId, initialAmount) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: `
        INSERT INTO shifts (employee_id, start_time, initial_amount, status) 
        VALUES (?, ?, ?, 'open')
      `,
      values: [employeeId, now, initialAmount]
    });
    
    return result.changes.lastId;
  }

  async closeShift(shiftId, finalAmount, cashBalance, terminalBalance, fuelExpense, remainingBalance, salaryPayments, cashExpenses, transferExpenses, totalRevenue, cardRevenue) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    await CapacitorSQLite.execute({
      database: this.dbName,
      statements: `
        UPDATE shifts 
        SET end_time = ?, final_amount = ?, cash_balance = ?, terminal_balance = ?, fuel_expense = ?, 
            remaining_balance = ?, salary_payments = ?, cash_expenses = ?, transfer_expenses = ?, 
            total_revenue = ?, card_revenue = ?, status = 'closed' 
        WHERE id = ?
      `,
      values: [now, finalAmount, cashBalance, terminalBalance, fuelExpense, remainingBalance, 
               salaryPayments, cashExpenses, transferExpenses, totalRevenue, cardRevenue, shiftId]
    });
  }

  async getShiftsHistory() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: `
        SELECT s.*, e.name as employee_name 
        FROM shifts s 
        JOIN employees e ON s.employee_id = e.id 
        ORDER BY s.start_time DESC
      `,
      values: []
    });
    return result.values || [];
  }

  async getOrdersByShift(shiftId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: `
        SELECT o.* 
        FROM orders o 
        WHERE o.shift_id = ?
        ORDER BY o.timestamp DESC
      `,
      values: [shiftId]
    });
    return result.values || [];
  }

  async getExpensesByShift(shiftId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
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

  async getExpensesByPaymentType(shiftId, paymentType) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: `
        SELECT e.*, et.name as expense_type_name
        FROM expenses e
        JOIN expense_types et ON e.expense_type_id = et.id
        WHERE e.shift_id = ? AND e.payment_type = ?
        ORDER BY e.timestamp DESC
      `,
      values: [shiftId, paymentType]
    });
    return result.values || [];
  }

  async getActiveShiftForEmployee(employeeId) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'SELECT * FROM shifts WHERE employee_id = ? AND status = "open" ORDER BY start_time DESC LIMIT 1',
      values: [employeeId]
    });
    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  async getExpenseTypes() {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'SELECT * FROM expense_types ORDER BY name',
      values: []
    });
    return result.values || [];
  }

  async addExpense(shiftId, expenseTypeId, amount, paymentType, comment) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: `
        INSERT INTO expenses (shift_id, expense_type_id, amount, payment_type, comment, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [shiftId, expenseTypeId, amount, paymentType, comment, now]
    });
    
    return result.changes.lastId;
  }

  async updateExpenseType(id, name) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: this.dbName,
      statements: 'UPDATE expense_types SET name = ? WHERE id = ?',
      values: [name, id]
    });
  }

  async deleteExpenseType(id) {
    await this.openDatabase();
    await CapacitorSQLite.execute({
      database: this.dbName,
      statements: 'DELETE FROM expense_types WHERE id = ?',
      values: [id]
    });
  }

  async createExpenseType(name) {
    await this.openDatabase();
    const result = await CapacitorSQLite.query({
      database: this.dbName,
      statement: 'INSERT INTO expense_types (name) VALUES (?)',
      values: [name]
    });
    return result.changes.lastId;
  }
}

export default new DatabaseService();