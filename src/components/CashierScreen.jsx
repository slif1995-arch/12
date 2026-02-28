import React, { useState, useEffect } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { useCart } from '../hooks/useCart';
import Cart from './Cart';
import OrderHistory from './OrderHistory';
import ExpenseModal from './ExpenseModal';
import './CashierScreen.css';

const CashierScreen = ({ currentShift }) => {
  const { db, loadCategories, loadProductsByCategory, searchProducts } = useDatabase();
  const { addToCart, cart, removeFromCart, updateQuantity } = useCart();
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    loadCategories().then(setCategories);
  }, [db]);

  useEffect(() => {
    if (activeCategory) {
      loadProductsByCategory(activeCategory.id).then(setProducts);
    }
  }, [activeCategory, db]);

  const handleSearch = async (term) => {
    if (term.trim() === '') {
      if (activeCategory) {
        loadProductsByCategory(activeCategory.id).then(setProducts);
      } else {
        setProducts([]);
      }
      return;
    }
    
    const searchResults = await searchProducts(term);
    setProducts(searchResults);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    setSearchTerm('');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  };

  const handleShowExpenses = () => {
    setShowExpenseModal(true);
  };

  const handleShowOrderHistory = () => {
    setShowOrderHistory(true);
  };

  if (!currentShift) {
    return (
      <div className="cashier-screen">
        <h2>Ошибка: Нет активной смены</h2>
        <p>Пожалуйста, откройте смену перед началом работы.</p>
      </div>
    );
  }

  return (
    <div className="cashier-screen">
      <div className="header">
        <h2>Экран кассира</h2>
        <div className="shift-info">
          <span>Смена открыта: {new Date(currentShift.start_time).toLocaleString()}</span>
          <button className="btn btn-secondary" onClick={() => setShowCart(!showCart)}>
            Корзина ({cart.length})
          </button>
          <button className="btn btn-warning" onClick={handleShowExpenses}>
            Расходы
          </button>
          <button className="btn btn-info" onClick={handleShowOrderHistory}>
            История заказов
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Поиск товаров..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="main-content">
        <div className="categories-panel">
          <h3>Категории</h3>
          <div className="categories-list">
            {categories.map(category => (
              <button
                key={category.id}
                className={`btn-category ${activeCategory?.id === category.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(category)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="products-panel">
          <h3>{activeCategory ? activeCategory.name : 'Выберите категорию'}</h3>
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card" onClick={() => handleAddToCart(product)}>
                <h4>{product.name}</h4>
                <p className="price">{product.price} ₽</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCart && (
        <div className="cart-overlay">
          <div className="cart-modal">
            <Cart 
              cart={cart} 
              removeFromCart={removeFromCart} 
              updateQuantity={updateQuantity}
              onClose={() => setShowCart(false)}
            />
          </div>
        </div>
      )}

      {showOrderHistory && (
        <OrderHistory 
          currentShift={currentShift}
          onClose={() => setShowOrderHistory(false)}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal 
          currentShift={currentShift}
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={() => {
            // Optionally refresh expenses list here
          }}
        />
      )}
    </div>
  );
};

export default CashierScreen;