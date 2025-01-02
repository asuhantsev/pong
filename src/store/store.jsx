import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { rootReducer } from './reducer.jsx';
import { createActionMiddleware } from './actions.jsx';
import Logger from '../utils/logger';
import performanceMonitor from '../utils/performance';
import { systemActions } from './actions.jsx';

const StoreContext = createContext(null);

// Middleware system
const applyMiddleware = (...middlewares) => (store) => {
  const chain = middlewares.map(middleware => middleware(store));
  return action => chain.reduce((acc, middleware) => middleware(acc), action);
};

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, () => {
    // Initialize with a clean state
    const initialState = rootReducer(undefined, { type: '@INIT' });
    Logger.info('Store', 'Initializing with clean state', initialState);
    return initialState;
  });

  // Initialize store on mount
  useEffect(() => {
    Logger.info('Store', 'Initializing store');
    dispatch(systemActions.init());
  }, []);

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
  return dispatch;
} 