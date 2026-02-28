import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const ExpenseModal = ({ currentShift, onClose, onExpenseAdded }) => {
  const { db } = useDatabase();
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load expense types from database
    const loadExpenseTypes = async () => {
      try {
        const result = await db.query(
          'SELECT id, name FROM expense_types ORDER BY name',
          []
        );
        setExpenseTypes(result);
        
        // Set default to first type if available
        if (result && result.length > 0) {
          setSelectedType(result[0].id.toString());
        }
      } catch (error) {
        console.error('Ошибка загрузки типов расходов:', error);
      }
    };

    loadExpenseTypes();
  }, [db]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedType) {
      newErrors.type = 'Выберите тип расхода';
    }

    if (!amount) {
      newErrors.amount = 'Введите сумму';
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Сумма должна быть положительным числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const amountValue = parseFloat(amount);
      
      // Add expense to database
      await db.run(
        `INSERT INTO expenses (shift_id, expense_type_id, amount, payment_type, comment, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          currentShift.id,
          parseInt(selectedType),
          amountValue,
          paymentType,
          comment || '',
          new Date().toISOString()
        ]
      );

      // Call callback to notify parent component
      onExpenseAdded && onExpenseAdded();

      // Close modal
      onClose();
    } catch (error) {
      console.error('Ошибка добавления расхода:', error);
      alert('Ошибка при сохранении расхода');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal expense-modal">
        <div className="modal-header">
          <h3>Добавить расход</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="expenseType">Категория расходов:</label>
            <select
              id="expenseType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={errors.type ? 'error' : ''}
            >
              {expenseTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {errors.type && <span className="error-message">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="paymentType">Способ оплаты:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="paymentType"
                  value="cash"
                  checked={paymentType === 'cash'}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                Наличные
              </label>
              <label>
                <input
                  type="radio"
                  name="paymentType"
                  value="transfer"
                  checked={paymentType === 'transfer'}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                Перевод
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Сумма расхода:</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="comment">Комментарий (необязательно):</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий..."
              rows="3"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Сохранить расход
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;