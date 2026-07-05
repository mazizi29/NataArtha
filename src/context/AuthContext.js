// src/context/AuthContext.js
import React, { createContext, useReducer, useEffect, useCallback } from 'react';
import * as api from '../services/api';

export const AuthContext = createContext();

const initialState = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  token: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isSignedIn: !!action.payload.token,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isSignedIn: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isSignedIn: false,
        user: null,
        token: null,
      };
    case 'SIGN_UP':
      return {
        ...state,
        isSignedIn: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = api.subscribeAuthState((session) => {
      dispatch({
        type: 'RESTORE_TOKEN',
        payload: {
          token: session?.token || null,
          user: session?.user || null,
        },
      });
    });

    // Try flushing any locally saved pending transactions after auth state restores
    const tryFlush = async () => {
      try {
        await api.flushPendingTransactions();
      } catch (e) {
        // ignore flush errors here
      }
    };

    tryFlush();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.loginUser(email, password);
      const { token, user } = response;

      dispatch({
        type: 'SIGN_IN',
        payload: { token, user },
      });

      // flush pending transactions after sign in
      try {
        await api.flushPendingTransactions();
      } catch (e) {
        // no-op
      }

      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.registerUser(name, email, password);
      const { token, user } = response;

      dispatch({
        type: 'SIGN_UP',
        payload: { token, user },
      });

      // flush pending transactions after sign up
      try {
        await api.flushPendingTransactions();
      } catch (e) {
        // no-op
      }

      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logoutUser();

      dispatch({ type: 'SIGN_OUT' });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Logout failed' };
    }
  }, []);

  const authContext = {
    state,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan dalam AuthProvider');
  }
  return context;
};
