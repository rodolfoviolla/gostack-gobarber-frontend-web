import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import ForgotPassword from '../../pages/ForgotPassword';
import api from '../../services/api';

const mockedApi = new MockAdapter(api);

const mockedHistoryPush = jest.fn();
const mockedAddToast = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    useHistory: () => ({
      push: mockedHistoryPush,
    }),
    Link: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('../../hooks/toast', () => {
  return {
    useToast: () => ({
      addToast: mockedAddToast,
    }),
  };
});

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    mockedHistoryPush.mockClear();
    mockedAddToast.mockClear();
  });

  it('should be able to reset password', async () => {
    mockedApi.onPost('/password/forgot').replyOnce(204);

    const { getByPlaceholderText, getByText } = render(<ForgotPassword />);

    const emailElement = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Recuperar');

    fireEvent.change(emailElement, {
      target: { value: 'johndoe@example.com' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
      expect(mockedHistoryPush).toHaveBeenCalledWith('/');
    });
  });

  it('should not be able to reset password with invalid e-mail', async () => {
    const { getByPlaceholderText, getByText } = render(<ForgotPassword />);

    const emailElement = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Recuperar');

    fireEvent.change(emailElement, {
      target: { value: 'not-valid-email' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/');
    });
  });

  it('should display an error if reset password fails', async () => {
    mockedApi.onPost('/password/forgot').networkError();

    const { getByPlaceholderText, getByText } = render(<ForgotPassword />);

    const emailElement = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Recuperar');

    fireEvent.change(emailElement, {
      target: { value: 'johndoe@example.com' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/');
    });
  });
});
