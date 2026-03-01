import React, { useState, useEffect } from 'react';
import './CartItemEditModal.css';

const CartItemEditModal = ({ item, onSave, onCancel }) => {
  const [quantity, setQuantity] = useState(item.qty || 1);
  const [comment, setComment] = useState(item.comment || '');

  const handleSave = () => {
    onSave({
      ...item,
      qty: quantity,
      comment: comment
    });
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal cart-item-edit-modal">
        <div className="modal-header">
          <h3>Редактировать товар</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Товар:</label>
            <span>{item.name}</span>
          </div>
          
          <div className="form-group">
            <label>Цена:</label>
            <span>{item.price} ₽</span>
          </div>
          
          <div className="form-group">
            <label>Количество:</label>
            <div className="quantity-controls">
              <button 
                className="btn btn-sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="btn btn-sm"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="comment">Комментарий:</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Введите комментарий к товару..."
              rows="3"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemEditModal;