import { capSQLite } from '@capacitor-community/sqlite';

export const schema = `
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT DEFAULT 'cashier',
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT DEFAULT NULL,
    initial_amount REAL DEFAULT 0,
    final_amount REAL DEFAULT NULL,
    status TEXT DEFAULT 'open', -- open, closed
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS expense_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL,
    order_type TEXT DEFAULT 'delivery', -- delivery, pickup, hall
    payment_type TEXT DEFAULT 'cash', -- cash, transfer
    discount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, cancelled
    timestamp TEXT NOT NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL,
    expense_type_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT DEFAULT 'cash', -- cash, transfer
    comment TEXT DEFAULT '',
    timestamp TEXT NOT NULL,
    FOREIGN KEY (shift_id) REFERENCES shifts(id),
    FOREIGN KEY (expense_type_id) REFERENCES expense_types(id)
  );
`;