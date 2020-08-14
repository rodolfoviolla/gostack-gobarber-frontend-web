import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';

import Profile from '../../pages/Profile';

import api from '../../services/api';

const mockedApi = new MockAdapter(api);

const mockedHistoryPush = jest.fn();
const mockedAddToast = jest.fn();
const mockedUpdateUser = jest.fn();

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

jest.mock('../../hooks/auth', () => {
  return {
    useAuth: () => ({
      updateUser: mockedUpdateUser,
      user: {
        name: 'John Doe',
        email: 'johndoe@example.com',
      },
    }),
  };
});

describe('Profile Page', () => {
  beforeEach(() => {
    mockedHistoryPush.mockClear();
    mockedAddToast.mockClear();
    mockedUpdateUser.mockClear();
  });

  it('should be able to update profile', async () => {
    const apiResponse = {
      id: 'user-id',
      name: 'John Doe',
      email: 'johndoe@example.com',
      avatar: 'avatar.jpg',
    };

    mockedApi.onPut('/profile').reply(200, apiResponse);

    const { getByPlaceholderText, getByText } = render(<Profile />);

    const nameElement = getByPlaceholderText('Nome');
    const emailElement = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameElement, { target: { value: 'John Doe' } });
    fireEvent.change(emailElement, {
      target: { value: 'johndoe@example.com' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).toHaveBeenCalledWith('/dashboard');
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });

  it('should be able to update the password', async () => {
    const apiResponse = {
      id: 'user-id',
      name: 'John Doe',
      email: 'johndoe@example.com',
      avatar: 'avatar.jpg',
    };

    mockedApi.onPut('/profile').reply(200, apiResponse);

    const { getByPlaceholderText, getByText } = render(<Profile />);

    const oldPasswordElement = getByPlaceholderText('Senha atual');
    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText('Confirmar senha');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(oldPasswordElement, { target: { value: '123456' } });
    fireEvent.change(passwordElement, { target: { value: '654321' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: '654321' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith(apiResponse);
      expect(mockedHistoryPush).toHaveBeenCalledWith('/dashboard');
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });

  it('should not be able to update the password if the password confirmation does not match', async () => {
    const { getByPlaceholderText, getByText } = render(<Profile />);

    const oldPasswordElement = getByPlaceholderText('Senha atual');
    const passwordElement = getByPlaceholderText('Nova senha');
    const passwordConfirmationElement = getByPlaceholderText('Confirmar senha');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(oldPasswordElement, { target: { value: '123456' } });
    fireEvent.change(passwordElement, { target: { value: '654321' } });
    fireEvent.change(passwordConfirmationElement, {
      target: { value: 'different-password-confirmation' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display an error if update profile fails', async () => {
    mockedApi.onPut('/profile').networkError();

    const { getByPlaceholderText, getByText } = render(<Profile />);

    const nameElement = getByPlaceholderText('Nome');
    const emailElement = getByPlaceholderText('E-mail');
    const buttonElement = getByText('Confirmar mudanças');

    fireEvent.change(nameElement, { target: { value: 'John Doe' } });
    fireEvent.change(emailElement, {
      target: { value: 'johndoe@example.com' },
    });
    fireEvent.click(buttonElement);

    await waitFor(() => {
      expect(mockedHistoryPush).not.toHaveBeenCalledWith('/dashboard');
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
        }),
      );
    });
  });

  it('should be able to update avatar', async () => {
    const apiResponse = {
      id: 'user-id',
      name: 'John Doe',
      email: 'johndoe@example.com',
      avatar: 'new-avatar.jpg',
      avatar_url: 'url/new-avatar.jpg',
    };

    mockedApi.onPatch('/users/avatar').reply(200, apiResponse);

    const { getByTestId } = render(<Profile />);

    const avatarElement = getByTestId('avatar-input');

    fireEvent.change(avatarElement, { target: { files: ['new-avatar.jpg'] } });

    await waitFor(() => {
      expect(mockedAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        }),
      );
    });
  });

  it('should not update avatar with no file sent', async () => {
    const { getByTestId } = render(<Profile />);

    const avatarElement = getByTestId('avatar-input');

    fireEvent.change(avatarElement, { target: { files: null } });

    await waitFor(() => {
      expect(mockedUpdateUser).not.toHaveBeenCalled();
    });
  });
});
