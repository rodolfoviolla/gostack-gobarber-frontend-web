import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import ResetPassword from '../../pages/ResetPassword';
import api from '../../services/api';

const mockedApi = new MockAdapter(api);

const mockedHistoryPush = jest.fn();
const mockedLocationSearchReplace = jest.fn();
const mockedAddToast = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    useHistory: () => ({
      push: mockedHistoryPush,
    }),
    useLocation: () => ({
      search: {
        replace: mockedLocationSearchReplace,
      },
    }),
  };
});

jest.mock('../../hooks/toast', () => {
  return {
    useToast: () => ({
      addToast: mockedAddToast,
    }),
  };
});

describe('ResetPassword Page', () => {
  beforeEach(() => {
    mockedHistoryPush.mockClear();
    mockedLocationSearchReplace.mockClear();
  });

  it('should be able to reset password', async () => {
    mockedLocationSearchReplace.mockImplementationOnce(() => 'token');
    mockedApi.onPost('/password/reset').replyOnce(204);

    const { getByPlaceholderText, getByText } = render(<ResetPassword />);

    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText(
      'Confirmação da senha',
    );
    const buttonElement = getByText('Alterar senha');

    fireEvent.change(passwordElement, { target: { value: '123456' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: '123456' },
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

  it('should not be able to reset password without token', async () => {
    mockedLocationSearchReplace.mockReturnValueOnce(undefined);

    const { getByPlaceholderText, getByText } = render(<ResetPassword />);

    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText(
      'Confirmação da senha',
    );
    const buttonElement = getByText('Alterar senha');

    fireEvent.change(passwordElement, { target: { value: '123456' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: '123456' },
    });

    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/');
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
    });
  });

  it('should not be able to reset password if password confirmation does not match', async () => {
    mockedLocationSearchReplace.mockImplementationOnce(() => 'token');

    const { getByPlaceholderText, getByText } = render(<ResetPassword />);

    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText(
      'Confirmação da senha',
    );
    const buttonElement = getByText('Alterar senha');

    fireEvent.change(passwordElement, { target: { value: '123456' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: 'different-password-confirmation' },
    });

    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/');
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
    });
  });

  it('should display an error if reset password fails', async () => {
    mockedLocationSearchReplace.mockImplementationOnce(() => 'token');
    mockedApi.onPost('/password/reset').networkError();

    const { getByPlaceholderText, getByText } = render(<ResetPassword />);

    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText(
      'Confirmação da senha',
    );
    const buttonElement = getByText('Alterar senha');

    fireEvent.change(passwordElement, { target: { value: '123456' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: '123456' },
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
