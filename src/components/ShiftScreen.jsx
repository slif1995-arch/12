import React, { useState, useEffect } from 'react';
import { db } from '../db';

const ShiftScreen = ({ onShiftOpened }) => {
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState('');
  const [initialCash, setInitialCash] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCashiersAndShift();
  }, []);

  const loadCashiersAndShift = async () => {
    try {
      setLoading(true);
      const cashiersList = await db.getActiveCashiers();
      setCashiers(cashiersList);

      // Проверяем, есть ли открытая смена у текущих кассиров
      for (const cashier of cashiersList) {
        const openShift = await db.getOpenShift(cashier.name);
        if (openShift) {
          setCurrentShift(openShift);
          break;
        }
      }
    } catch (error) {
      console.error('Error loading cashiers and shift:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!selectedCashier || !initialCash) {
      alert('Пожалуйста, выберите кассира и введите начальную сумму');
      return;
    }

    try {
      const shift = await db.openShift(selectedCashier, parseFloat(initialCash));
      setCurrentShift(shift);
      onShiftOpened(shift);
    } catch (error) {
      console.error('Error opening shift:', error);
      alert('Ошибка при открытии смены');
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;

    // Для простоты в этом примере предполагаем, что итоговая сумма равна начальной
    // В реальном приложении это должно быть вычислено на основе всех транзакций за смену
    const expectedCash = currentShift.initialCash;
    const actualCash = prompt(`Введите фактическую сумму в кассе (ожидаемая: ${expectedCash}):`, expectedCash);
    
    if (actualCash === null) return; // пользователь отменил
    
    const difference = parseFloat(actualCash) - expectedCash;

    try {
      await db.closeShift(currentShift.id, {
        expected: expectedCash,
        actual: parseFloat(actualCash),
        difference: difference
      });
      
      setCurrentShift(null);
      await loadCashiersAndShift();
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Ошибка при закрытии смены');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6 text-center">Управление сменой</h2>
        
        {currentShift ? (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800">Активная смена</h3>
            <p className="text-sm text-gray-600">Кассир: {currentShift.cashier_name || currentShift.cashier}</p>
            <p className="text-sm text-gray-600">Начало: {new Date(currentShift.start_time || currentShift.openedAt).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Начальная сумма: {(currentShift.initial_amount || currentShift.initialCash).toFixed(2)}</p>
            
            <button
              onClick={handleCloseShift}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Закрыть смену
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите кассира
              </label>
              <select
                value={selectedCashier}
                onChange={(e) => setSelectedCashier(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Выберите кассира</option>
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.name}>
                    {cashier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Начальная сумма в кассе
              </label>
              <input
                type="number"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                placeholder="Введите сумму"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={handleOpenShift}
              disabled={!selectedCashier || !initialCash}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Открыть смену
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftScreen;