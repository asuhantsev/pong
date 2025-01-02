import { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
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
  const [state, baseDispatch] = useReducer(rootReducer, undefined, () => {
    // Initialize with a clean state
    const initialState = rootReducer(undefined, { type: '@INIT' });
    Logger.info('Store', 'Initializing with clean state', initialState);
    return initialState;
  });

  // Create store object with memoized methods
  const store = useMemo(() => ({
    getState: () => state,
    dispatch: action => {
      performanceMonitor.startMeasure(`dispatch_${action.type}`);
      baseDispatch(action);
      performanceMonitor.endMeasure(`dispatch_${action.type}`, 'actions');
    }
  }), [state]);

  // Apply middleware with memoization
  const enhancedDispatch = useMemo(() => 
    applyMiddleware(createActionMiddleware)(store)(store.dispatch),
    [store]
  );

  // Initialize store on mount
  useEffect(() => {
    Logger.info('Store', 'Initializing store');
    enhancedDispatch(systemActions.init());
  }, []); // Only run once on mount

  return (
    <StoreContext.Provider value={{ state, dispatch: enhancedDispatch }}>
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