import React, { useState, useEffect } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { useShifts } from '../hooks/useShifts';
import { db } from '../db';
import './CashierSelection.css';
import viteLogo from '/vite.svg';

export default function CashierSelection({ onCashierSelected }) {
  const { employees, loading, error, getActiveCashiers } = useEmployees();
  const { getOpenShift, openShift } = useShifts();
  const [cashiers, setCashiers] = useState([]);
  const [loadingCashiers, setLoadingCashiers] = useState(true);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [initialAmount, setInitialAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    // Инициализируем базу данных
    db.init().then(() => {
      loadCashiers();
    }).catch(err => {
      console.error('Ошибка инициализации базы данных:', err);
    });
  }, []);

  const loadCashiers = async () => {
    try {
      setLoadingCashiers(true);
      const cashiersData = await getActiveCashiers();
      setCashiers(cashiersData);
    } catch (err) {
      console.error('Ошибка загрузки кассиров:', err);
    } finally {
      setLoadingCashiers(false);
    }
  };

  const handleCashierClick = async (cashier) => {
    try {
      // Проверяем, есть ли у кассира открытая смена
      const openShift = await getOpenShift(cashier);
      if (openShift) {
        alert(`У кассира ${cashier.name} уже есть открытая смена!`);
        return;
      }
      
      setSelectedCashier(cashier);
      setInitialAmount('');
      setModalError('');
      setShowModal(true);
    } catch (err) {
      console.error('Ошибка проверки смены:', err);
      alert('Произошла ошибка при проверке смены');
    }
  };

  const handleOpenShift = async () => {
    try {
      const amount = parseFloat(initialAmount);
      
      if (isNaN(amount) || amount < 0) {
        setModalError('Введите корректную сумму (неотрицательное число)');
        return;
      }

      if (amount > 100000) {
        setModalError('Сумма не может превышать 100 000 рублей');
        return;
      }

      const shift = await openShift(selectedCashier.name, amount);
      setShowModal(false);
      onCashierSelected(selectedCashier, shift);
    } catch (err) {
      console.error('Ошибка открытия смены:', err);
      setModalError('Произошла ошибка при открытии смены');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCashier(null);
    setInitialAmount('');
    setModalError('');
  };

  if (loading || loadingCashiers) {
    return (
      <div className="cashier-selection loading">
        <div className="loading-spinner"></div>
        <p>Загрузка кассиров...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cashier-selection error">
        <p>Ошибка загрузки: {error}</p>
        <button onClick={loadCashiers} className="retry-btn">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="cashier-selection">
      <div className="selection-header">
        <img src={viteLogo} alt="Sushi POS" className="logo" />
        <h1>Выбор кассира</h1>
        <p>Выберите кассира для открытия смены</p>
      </div>

      <div className="cashiers-grid">
        {cashiers.length === 0 ? (
          <div className="no-cashiers">
            <p>Нет доступных кассиров</p>
            <p className="hint">Добавьте кассиров в админ панели</p>
          </div>
        ) : (
          cashiers.map((cashier) => (
            <div
              key={cashier.id}
              className="cashier-card"
              onClick={() => handleCashierClick(cashier)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleCashierClick(cashier)}
            >
              <div className="cashier-avatar">
                <span className="avatar-icon">👤</span>
              </div>
              <div className="cashier-info">
                <h3>{cashier.name}</h3>
                <p className="cashier-position">{cashier.position}</p>
              </div>
              <div className="cashier-actions">
                <span className="select-arrow">→</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно для ввода начальной суммы */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Открытие смены</h2>
              <p>Кассир: <strong>{selectedCashier?.name}</strong></p>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="initialAmount">Начальная сумма в кассе</label>
                <input
                  type="number"
                  id="initialAmount"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="Введите сумму"
                  min="0"
                  step="0.01"
                  autoFocus
                  className="amount-input"
                />
                {modalError && <div className="error-message">{modalError}</div>}
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={handleCloseModal}
                >
                  Отмена
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleOpenShift}
                  disabled={!initialAmount || parseFloat(initialAmount) < 0}
                >
                  Открыть смену
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}