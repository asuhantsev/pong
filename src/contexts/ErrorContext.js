import { createContext, useContext, useState, useCallback } from 'react';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState({
    local: null,
    socket: null,
    network: null
  });

  const setError = useCallback((type, error) => {
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
  }, []);

  const clearError = useCallback((type) => {
    setErrors(prev => ({
      ...prev,
      [type]: null
    }));
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, setError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
} 