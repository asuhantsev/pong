import { createContext, useContext, useReducer, useCallback } from 'react';
import { rootReducer } from './reducer';
import { createActionMiddleware } from './actions';
import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';

const StoreContext = createContext(null);

// Middleware system
const applyMiddleware = (...middlewares) => (store) => {
  const chain = middlewares.map(middleware => middleware(store));
  return action => chain.reduce((acc, middleware) => middleware(acc), action);
};

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, rootReducer(undefined, { type: '@INIT' }));

  // Create store object
  const store = {
    getState: () => state,
    dispatch: action => {
      performanceMonitor.startMeasure(`dispatch_${action.type}`);
      dispatch(action);
      performanceMonitor.endMeasure(`dispatch_${action.type}`, 'actions');
    }
  };

  // Apply middleware
  const enhancedDispatch = applyMiddleware(
    createActionMiddleware
  )(store)(store.dispatch);

  // Memoize the context value
  const value = {
    state,
    dispatch: enhancedDispatch
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Selector hook for optimized re-renders
export function useSelector(selector) {
  const { state } = useStore();
  return selector(state);
}

// Action dispatcher hook
export function useDispatch() {
  const { dispatch } = useStore();
  return useCallback((action) => {
    Logger.debug('Dispatch', `Dispatching action: ${action.type}`, action);
    return dispatch(action);
  }, [dispatch]);
} 