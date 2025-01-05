import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './reducers';
import validationMiddleware from './middleware/validationMiddleware';
import Logger from '../utils/logger';

const loggerMiddleware = store => next => action => {
  Logger.debug('Store', 'Dispatching action:', action);
  const result = next(action);
  Logger.debug('Store', 'New state:', store.getState());
  return result;
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(validationMiddleware)
      .concat(loggerMiddleware),
  devTools: true
});

export { useDispatch, useSelector } from 'react-redux'; 