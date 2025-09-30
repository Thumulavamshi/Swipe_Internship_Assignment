import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import candidateReducer from './candidateSlice';
import sessionReducer from './sessionSlice';

// Combine reducers
const rootReducer = combineReducers({
  candidate: candidateReducer,
  session: sessionReducer,
});

// Persist configuration
const persistConfig = {
  key: 'swipe-interview-app',
  storage,
  whitelist: ['candidate', 'session'], // Persist both candidate and session data
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PURGE',
          'persist/FLUSH',
          'persist/PAUSE'
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;