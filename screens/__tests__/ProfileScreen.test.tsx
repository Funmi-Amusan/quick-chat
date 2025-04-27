import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router'; 

import ProfileScreen from '../ProfileScreen';

import { useSession } from '~/context/authContext';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('~/context/authContext', () => ({
  useSession: jest.fn(),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    useSession.mockReturnValue({
      signOut: jest.fn(),
    });
  });

  it('handles sign out when logout button is pressed', () => {
    const mockSignOut = jest.fn();
    useSession.mockReturnValue({ signOut: mockSignOut });

    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Logout'));

    expect(mockSignOut).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/sign-in');
  });
});
