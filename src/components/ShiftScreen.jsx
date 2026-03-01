import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { database } from '../database';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const ShiftScreen = ({ onShiftOpened }) => {
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState('');
  const [initialCash, setInitialCash] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [closingData, setClosingData] = useState({
    remaining: '',
    terminal: '',
    fuel: '',
    cash: '',
    selectedEmployees: []
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadCashiersAndShift();
  }, []);

  const loadCashiersAndShift = async () => {
    try {
      setLoading(true);
      const cashiersList = await db.getActiveCashiers();
      setCashiers(cashiersList);

      // Load all employees for salary selection
      const allEmployees = await db.getAllEmployees();
      setEmployees(allEmployees);

      // Check for open shifts
      for (const cashier of cashiersList) {
        const openShift = await database.getActiveShiftForEmployee(cashier.id);
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
      const shiftId = await database.createShift(parseInt(selectedCashier), parseFloat(initialCash));
      const shift = await database.getCurrentShift(parseInt(selectedCashier));
      setCurrentShift(shift);
      onShiftOpened(shift);
    } catch (error) {
      console.error('Error opening shift:', error);
      alert('Ошибка при открытии смены');
    }
  };

  const handleShowCloseShiftModal = async () => {
    if (!currentShift) return;

    // Calculate values for closing based on shift transactions
    const shiftTransactions = await db.getShiftTransactions(currentShift.id);
    
    // Calculate total revenue (payments)
    const totalRevenue = shiftTransactions.orders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Calculate card revenue
    const cardRevenue = shiftTransactions.orders
      .filter(order => order.payment_type === 'transfer')
      .reduce((sum, order) => sum + order.total_amount, 0);
    
    // Calculate cash expenses
    const cashExpenses = shiftTransactions.expenses
      .filter(expense => expense.payment_type === 'cash')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate transfer expenses
    const transferExpenses = shiftTransactions.expenses
      .filter(expense => expense.payment_type === 'transfer')
      .reduce((sum, expense) => sum + expense.amount, 0);

    setClosingData({
      ...closingData,
      remaining: currentShift.initial_amount || currentShift.initialCash,
      terminal: cardRevenue.toString(),
      fuel: '0',
      cash: (totalRevenue - cardRevenue - cashExpenses).toString(),
      selectedEmployees: [],
      totalRevenue: totalRevenue,
      cardRevenue: cardRevenue,
      cashExpenses: cashExpenses,
      transferExpenses: transferExpenses
    });

    setShowCloseShiftModal(true);
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;

    try {
      await database.closeShift(
        currentShift.id,
        parseFloat(closingData.cash) + parseFloat(closingData.terminal),
        parseFloat(closingData.cash),
        parseFloat(closingData.terminal),
        parseFloat(closingData.fuel),
        parseFloat(closingData.remaining),
        0, // salary_payments - will be calculated based on selected employees
        closingData.cashExpenses,
        closingData.transferExpenses,
        closingData.totalRevenue,
        closingData.cardRevenue
      );
      
      setShowCloseShiftModal(false);
      setCurrentShift(null);
      await loadCashiersAndShift();
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Ошибка при закрытии смены');
    }
  };

  const handleEmployeeToggle = (employeeId) => {
    setClosingData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.selectedEmployees, employeeId]
    }));
  };

  const renderCloseShiftModal = () => (
    <Transition appear show={showCloseShiftModal} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setShowCloseShiftModal(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Закрытие смены
                </Dialog.Title>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Остаток</label>
                    <input
                      type="number"
                      value={closingData.remaining}
                      onChange={(e) => setClosingData({...closingData, remaining: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Остаток"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Терминал</label>
                    <input
                      type="number"
                      value={closingData.terminal}
                      onChange={(e) => setClosingData({...closingData, terminal: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Терминал"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Бензин</label>
                    <input
                      type="number"
                      value={closingData.fuel}
                      onChange={(e) => setClosingData({...closingData, fuel: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Бензин"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Касса</label>
                    <input
                      type="number"
                      value={closingData.cash}
                      onChange={(e) => setClosingData({...closingData, cash: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Касса"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Выплата ЗП</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {employees.map(employee => (
                        <div key={employee.id} className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            id={`employee-${employee.id}`}
                            checked={closingData.selectedEmployees.includes(employee.id)}
                            onChange={() => handleEmployeeToggle(employee.id)}
                            className="mr-2"
                          />
                          <label htmlFor={`employee-${employee.id}`} className="text-sm">
                            {employee.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    type="button"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    onClick={handleCloseShift}
                  >
                    Закрыть смену
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
                    onClick={() => setShowCloseShiftModal(false)}
                  >
                    Отмена
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

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
              onClick={handleShowCloseShiftModal}
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
                  <option key={cashier.id} value={cashier.id}>
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
      {renderCloseShiftModal()}
    </div>
  );
};

export default ShiftScreen;