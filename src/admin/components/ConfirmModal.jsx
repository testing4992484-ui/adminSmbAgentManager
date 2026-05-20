import { useEffect, useRef } from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger = false, children }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(9,9,20,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: 'backdropFade 0.2s ease forwards'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#151528',
        border: '1px solid #2a2a4a',
        borderRadius: 20,
        padding: '28px 32px',
        maxWidth: 440,
        width: '100%',
        animation: 'fadeSlideUp 0.2s ease forwards'
      }}>
        <h3 style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
          {title}
        </h3>
        <p style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14, lineHeight: 1.6, marginBottom: children ? 16 : 24 }}>
          {message}
        </p>
        {children && <div style={{ marginBottom: 24 }}>{children}</div>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="admin-btn" style={{
            padding: '10px 20px', borderRadius: 10,
            background: 'transparent', border: '1px solid #2a2a4a',
            color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600
          }}>
            {cancelText}
          </button>
          <button onClick={onConfirm} className="admin-btn" style={{
            padding: '10px 20px', borderRadius: 10,
            background: danger ? '#ff003c' : '#9d00ff',
            border: 'none',
            color: '#fff', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 700,
            boxShadow: danger ? '0 0 16px #ff003c60' : '0 0 16px #9d00ff60'
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
