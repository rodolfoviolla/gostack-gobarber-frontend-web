import React, { createContext, useCallback, useState, useContext } from 'react';
import ms from 'ms';
import { addMilliseconds, isAfter } from 'date-fns';

import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface AuthState {
  token: string;
  tokenExpiration: Date;
  user: User;
}

interface SignInCredencials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  signIn(credentials: SignInCredencials): Promise<void>;
  signOut(): void;
  updateUser(user: User): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@GoBarber:token');
    const tokenExpirationItem = localStorage.getItem(
      '@GoBarber:token-expiration',
    );
    const user = localStorage.getItem('@GoBarber:user');

    if (token && tokenExpirationItem && user) {
      const today = new Date(Date.now());
      const tokenExpiration = new Date(JSON.parse(tokenExpirationItem));

      if (isAfter(tokenExpiration, today)) {
        api.defaults.headers.authorization = `Bearer ${token}`;

        return {
          token,
          tokenExpiration,
          user: JSON.parse(user),
        };
      }

      localStorage.removeItem('@GoBarber:token');
      localStorage.removeItem('@GoBarber:token-expiration');
      localStorage.removeItem('@GoBarber:user');
    }

    return {} as AuthState;
  });

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions', {
      email,
      password,
    });

    const { token, user, expiresIn } = response.data;

    const expiresInMilliseconds = Number(ms(expiresIn));

    let tokenExpiration = new Date(Date.now());
    tokenExpiration = addMilliseconds(tokenExpiration, expiresInMilliseconds);

    localStorage.setItem('@GoBarber:token', token);
    localStorage.setItem(
      '@GoBarber:token-expiration',
      JSON.stringify(tokenExpiration),
    );
    localStorage.setItem('@GoBarber:user', JSON.stringify(user));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, tokenExpiration, user });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@GoBarber:token');
    localStorage.removeItem('@GoBarber:token-expiration');
    localStorage.removeItem('@GoBarber:user');

    setData({} as AuthState);
  }, []);

  const updateUser = useCallback(
    (user: User) => {
      localStorage.setItem('@GoBarber:user', JSON.stringify(user));

      setData({
        token: data.token,
        tokenExpiration: data.tokenExpiration,
        user,
      });
    },
    [setData, data],
  );

  return (
    <AuthContext.Provider
      value={{ user: data.user, signIn, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth };
