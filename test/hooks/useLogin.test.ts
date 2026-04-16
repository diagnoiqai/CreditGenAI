/**
 * useLogin Hook Test Suite
 * Test Cases: 8 | Bug: BUG-CGENAI-001 (displayName not saved) | Feature: Auth
 * 
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║ TEST CASE SUMMARY TABLE                                                ║
 * ╠════╦══════════════════════════════════╦════════════╦════════════════════╣
 * ║ ID ║ Test Name                        ║ Category   ║ Expected Result    ║
 * ╠════╬══════════════════════════════════╬════════════╬════════════════════╣
 * ║ 001║ displayName state management     ║ State      ║ initializes empty  ║
 * ║ 002║ Firebase Auth user creation      ║ Firebase   ║ user created       ║
 * ║ 003║ updateProfile called w/ name     ║ Firebase   ║ profile updated    ║
 * ║ 004║ API saveUserProfile call         ║ Database   ║ profile saved db   ║
 * ║ 005║ Empty displayName validation     ║ Validation ║ error shown        ║
 * ║ 006║ updateProfile error handling     ║ Error      ║ graceful fail      ║
 * ║ 007║ End-to-end signup flow           ║ E2E        ║ full flow works    ║
 * ║ 008║ Sign in vs sign up distinction   ║ Auth       ║ only signup saves  ║
 * ╚════╩══════════════════════════════════╩════════════╩════════════════════╝
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogin } from '../../src/hooks/useLogin';
import * as firebaseAuth from 'firebase/auth';
import { apiService } from '../../src/services/apiService';

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../../src/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

vi.mock('../../src/services/apiService', () => ({
  apiService: {
    saveUserProfile: vi.fn(),
    getUserProfile: vi.fn(),
    checkInvite: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useLogin - displayName & Profile (BUG-CGENAI-001)', () => {
  // TEST-001: displayName state management
  it('TEST-001a: should initialize displayName as empty string', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.displayName).toBe('');
  });

  it('TEST-001b: should update displayName when setDisplayName is called', () => {
    const { result } = renderHook(() => useLogin());
    
    act(() => {
      result.current.setDisplayName('John Doe');
    });
    
    expect(result.current.displayName).toBe('John Doe');
  });

  it('TEST-001c: should preserve displayName across renders', () => {
    const { result, rerender } = renderHook(() => useLogin());
    
    act(() => {
      result.current.setDisplayName('Jane Smith');
    });
    
    rerender();
    expect(result.current.displayName).toBe('Jane Smith');
  });

  // TEST-002: Firebase Auth Creation
  it('should call createUserWithEmailAndPassword with email and password', async () => {
    const mockUserCredential = {
      user: { uid: 'test-uid-123', email: 'test@example.com' },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName('John Doe');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });

  // TEST-003: updateProfile Call (Firebase)
  it('should call updateProfile with displayName after signup', async () => {
    const mockUserCredential = {
      user: { uid: 'test-uid-123', email: 'test@example.com' },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName('John Doe');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(
      mockUserCredential.user,
      { displayName: 'John Doe' }
    );
  });

  it('updateProfile should receive exact displayName from form', async () => {
    const mockUserCredential = {
      user: { uid: 'user-456', email: 'jane@example.com' },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setDisplayName('Jane Smith');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(
      expect.any(Object),
      { displayName: 'Jane Smith' }
    );
  });

  // TEST-004: API Call to Save Profile (DATABASE)
  it('CURRENTLY FAILING: should call apiService.saveUserProfile after signup', async () => {
    const mockUserCredential = {
      user: {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe',
      },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);
    vi.mocked(apiService.saveUserProfile).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName('John Doe');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    expect(apiService.saveUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe',
      })
    );
  });

  it('should pass correct profile data to saveUserProfile', async () => {
    const mockUserCredential = {
      user: {
        uid: 'uid-999',
        email: 'user@test.com',
        displayName: 'Test User',
      },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);
    vi.mocked(apiService.saveUserProfile).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('user@test.com');
      result.current.setDisplayName('Test User');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Check that uid and displayName are saved to database
    expect(apiService.saveUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: expect.any(String),
        email: 'user@test.com',
        displayName: 'Test User',
      })
    );
  });

  // TEST-005: Empty displayName Validation
  it('should show error when displayName is empty on signup', async () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName(''); // Empty displayName
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Should either show error or not call Firebase
    expect(result.current.error).toBeTruthy();
  });

  it('should not create Firebase user if displayName is empty', async () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName('');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Firebase should not be called
    expect(firebaseAuth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  // TEST-006: Error Handling
  it('should handle updateProfile failure gracefully', async () => {
    const mockUserCredential = {
      user: { uid: 'test-uid', email: 'test@example.com' },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockRejectedValueOnce(
      new Error('Failed to update profile')
    );

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('test@example.com');
      result.current.setPassword('password123');
      result.current.setDisplayName('John Doe');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Should show error message
    expect(result.current.error).toBeTruthy();
  });

  it('should not call saveUserProfile if updateProfile fails', async () => {
    const mockUserCredential = {
      user: { uid: 'test-uid', email: 'test@example.com' },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockRejectedValueOnce(
      new Error('Update failed')
    );

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setDisplayName('John Doe');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Database save should not be called if Firebase update fails
    expect(apiService.saveUserProfile).not.toHaveBeenCalled();
  });

  // TEST-007: Successful Signup End-to-End
  it('should complete full signup flow: email → password → name → Firebase → Database', async () => {
    const mockUserCredential = {
      user: {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'Alice Johnson',
      },
    };
    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce(mockUserCredential as any);
    vi.mocked(firebaseAuth.updateProfile).mockResolvedValueOnce(undefined);
    vi.mocked(apiService.saveUserProfile).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('newuser@example.com');
      result.current.setPassword('SecurePass123!');
      result.current.setDisplayName('Alice Johnson');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'newuser@example.com',
      'SecurePass123!'
    );

    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(
      mockUserCredential.user,
      { displayName: 'Alice Johnson' }
    );

    expect(apiService.saveUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'Alice Johnson',
      })
    );

    expect(result.current.error).toBeNull();
  });

  // TEST-008: Sign In vs Sign Up
  it('should NOT call updateProfile when signing in (not signup)', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'existing-user', email: 'user@example.com' },
    } as any);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(false); // Sign in, not signup
      result.current.setEmail('user@example.com');
      result.current.setPassword('password123');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // updateProfile should NOT be called for sign in
    expect(firebaseAuth.updateProfile).not.toHaveBeenCalled();
  });

  it('should NOT call saveUserProfile when signing in', async () => {
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'existing-user', email: 'user@example.com' },
    } as any);

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.setIsSignUp(false);
      result.current.setEmail('user@example.com');
      result.current.setPassword('password123');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // saveUserProfile should NOT be called for sign in
    expect(apiService.saveUserProfile).not.toHaveBeenCalled();
  });
});
