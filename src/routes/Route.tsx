import React from 'react';
import {
  Route as ReactDOMRoute,
  RouteProps as ReactDOMRouteProps,
  Redirect,
} from 'react-router-dom';

import { useAuth } from '../hooks/auth';
import { useToast } from '../hooks/toast';

import api from '../services/api';

interface RouteProps extends ReactDOMRouteProps {
  isPrivate?: boolean;
  component: React.ComponentType;
}

const Route: React.FC<RouteProps> = ({
  isPrivate = false,
  component: Component,
  ...rest
}) => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();

  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response.status === 401) {
        const token = localStorage.getItem('@GoBarber:token');

        signOut();

        if (token) {
          addToast({
            type: 'error',
            title: 'Acesso expirado',
            description: 'Por favor, faça logon novamente!',
          });
        }
      }
      return Promise.reject(error);
    },
  );

  return (
    <ReactDOMRoute
      {...rest}
      render={({ location }) => {
        return isPrivate === !!user ? (
          <Component />
        ) : (
          <Redirect
            to={{
              pathname: isPrivate ? '/' : '/dashboard',
              state: { from: location },
            }}
          />
        );
      }}
    />
  );
};

export default Route;
