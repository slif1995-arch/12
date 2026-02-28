import { useState, useEffect } from 'react';
import { db } from '../db';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await db.getEmployees();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Ошибка загрузки сотрудников:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      const newEmployee = await db.addEmployee(employeeData);
      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateEmployee = async (id, updates) => {
    try {
      const updatedEmployee = await db.updateEmployee(id, updates);
      if (updatedEmployee) {
        setEmployees(prev => prev.map(emp => 
          emp.id === id ? updatedEmployee : emp
        ));
      }
      return updatedEmployee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await db.deleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getActiveCashiers = async () => {
    try {
      const cashiers = await db.getActiveCashiers();
      return cashiers;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getActiveCashiers,
    refresh: loadEmployees
  };
}