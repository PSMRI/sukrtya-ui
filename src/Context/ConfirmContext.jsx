import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "primary", // 'primary', 'danger', 'warning'
    resolvePromise: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || "Confirm Action",
        message: options.message || "Are you sure you want to proceed?",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        type: options.type || "primary",
        resolvePromise: resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (confirmState.resolvePromise) {
      confirmState.resolvePromise(true);
    }
    closeModal();
  };

  const handleCancel = () => {
    if (confirmState.resolvePromise) {
      confirmState.resolvePromise(false);
    }
    closeModal();
  };

  const closeModal = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative"
          }}>
            <h3 style={{
              margin: "0 0 12px 0",
              fontSize: "20px",
              fontWeight: 800,
              color: "#0f172a"
            }}>
              {confirmState.title}
            </h3>
            <p style={{
              margin: "0 0 24px 0",
              fontSize: "15px",
              color: "#475569",
              lineHeight: "1.5"
            }}>
              {confirmState.message}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                {confirmState.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: confirmState.type === 'danger' ? '#ef4444' : confirmState.type === 'warning' ? '#f59e0b' : '#2563eb',
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: confirmState.type === 'danger' ? '0 4px 12px rgba(239,68,68,0.3)' : confirmState.type === 'warning' ? '0 4px 12px rgba(245,158,11,0.3)' : '0 4px 12px rgba(37,99,235,0.3)',
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = confirmState.type === 'danger' ? '0 6px 16px rgba(239,68,68,0.4)' : confirmState.type === 'warning' ? '0 6px 16px rgba(245,158,11,0.4)' : '0 6px 16px rgba(37,99,235,0.4)';
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = confirmState.type === 'danger' ? '0 4px 12px rgba(239,68,68,0.3)' : confirmState.type === 'warning' ? '0 4px 12px rgba(245,158,11,0.3)' : '0 4px 12px rgba(37,99,235,0.3)';
                }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
