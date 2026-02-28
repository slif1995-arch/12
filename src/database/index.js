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

  async closeShift(shiftId, finalAmount) {
    await this.openDatabase();
    
    const now = new Date().toISOString();
    await CapacitorSQLite.execute({
      database: this.dbName,
      statements: `
        UPDATE shifts 
        SET end_time = ?, final_amount = ?, status = 'closed' 
        WHERE id = ?
      `,
      values: [now, finalAmount, shiftId]
    });
  }
}

export default new DatabaseService();