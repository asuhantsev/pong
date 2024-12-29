import React, { createContext, useContext, useState } from 'react';

const ErrorContext = createContext(null);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);

  const setError = (error) => {
    setErrors((prev) => [...prev, error]);
  };

  const clearError = (index) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ErrorContext.Provider value={{ errors, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
} 