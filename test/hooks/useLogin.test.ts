/**
 * useLogin Hook Test Suite
 * 
 * This file contains comprehensive test cases for src/hooks/useLogin.ts
 * Primary focus: BUG-CGENAI-001 - displayName not stored in database on signup
 *
 * BUG DETAILS:
 * ============
 * Root Cause: When user signs up via email/password:
 *   1. displayName is collected from form input ✓
 *   2. Firebase Auth user is created ✓
 *   3. updateProfile() saves displayName to Firebase Auth ✓
 *   4. ❌ NO API call to save profile to PostgreSQL database
 *   Result: displayName exists in Firebase Auth but NOT in app's database
 *
 * Location: src/hooks/useLogin.ts (line 84-91)
 * 
 * The fix requires:
 * 1. Add apiService.saveUserProfile() call after successful signup
 * 2. Add error handling for updateProfile() failures
 * 3. Add validation to prevent empty displayName submission
 * 4. Ensure uid and displayName are passed to database
 *
 * Testing Strategy:
 * =================
 * TEST-001: displayName State Management
 *           Verify displayName state updates correctly from input
 *
 * TEST-002: Firebase Auth Creation
 *           Verify user is created in Firebase Auth during signup
 *
 * TEST-003: updateProfile Call (Firebase)
 *           Verify updateProfile is called with displayName after signup
 *
 * TEST-004: API Call to Save Profile (DATABASE) - CURRENTLY FAILING
 *           Verify apiService.saveUserProfile is called after signup
 *           This is the PRIMARY FIX - currently this call doesn't exist
 *
 * TEST-005: Empty displayName Validation
 *           Verify signup fails/shows error when displayName is empty
 *
 * TEST-006: Error Handling - updateProfile Failure
 *           Verify graceful error handling if Firebase updateProfile fails
 *
 * TEST-007: Successful Signup End-to-End
 *           Verify complete signup flow: email → password → name → Firebase → Database
 *
 * TEST-008: Sign In vs Sign Up
 *           Verify sign in doesn't call updateProfile or saveUserProfile
 *
 * Manual Verification Steps:
 * ==========================
 * 1. Run: npm run test
 * 2. Sign up new user with email/password/displayName
 * 3. Check Firebase Console → Authentication → Users
 *    - displayName should be present ✓
 * 4. Query PostgreSQL database:
 *    - SELECT * FROM dev.users WHERE uid = 'user-uid'
 *    - display_name should be populated ✓ (Currently NULL - this is the bug)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogin } from '../../src/hooks/useLogin';
import * as firebaseAuth from 'firebase/auth';
import { apiService } from '../../src/services/apiService';

// ============================================================================
// MOCK SETUP
// ============================================================================

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

// ============================================================================
// TEST-001: displayName State Management
// ============================================================================

describe('useLogin - TEST-001: displayName State Management', () => {
  it('should initialize displayName as empty string', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.displayName).toBe('');
  });

  it('should update displayName when setDisplayName is called', () => {
    const { result } = renderHook(() => useLogin());
    
    act(() => {
      result.current.setDisplayName('John Doe');
    });
    
    expect(result.current.displayName).toBe('John Doe');
  });

  it('should preserve displayName across renders', () => {
    const { result, rerender } = renderHook(() => useLogin());
    
    act(() => {
      result.current.setDisplayName('Jane Smith');
    });
    
    rerender();
    expect(result.current.displayName).toBe('Jane Smith');
  });
});

// ============================================================================
// TEST-002: Firebase Auth Creation
// ============================================================================

describe('useLogin - TEST-002: Firebase Auth Creation', () => {
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
});

// ============================================================================
// TEST-003: updateProfile Call (Firebase)
// ============================================================================

describe('useLogin - TEST-003: updateProfile Call (Firebase)', () => {
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
});

// ============================================================================
// TEST-004: API Call to Save Profile (DATABASE) - PRIMARY FIX POINT
// ============================================================================

describe('useLogin - TEST-004: API Call to Save Profile to Database', () => {
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

    // ❌ THIS WILL FAIL - apiService.saveUserProfile is never called
    // FIX: Add this after updateProfile in useLogin.ts
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
});

// ============================================================================
// TEST-005: Empty displayName Validation
// ============================================================================

describe('useLogin - TEST-005: Empty displayName Validation', () => {
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
});

// ============================================================================
// TEST-006: Error Handling - updateProfile Failure
// ============================================================================

describe('useLogin - TEST-006: Error Handling', () => {
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
});

// ============================================================================
// TEST-007: Successful Signup End-to-End
// ============================================================================

describe('useLogin - TEST-007: Successful Signup End-to-End', () => {
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

    // Step 1: User enters signup form data
    act(() => {
      result.current.setIsSignUp(true);
      result.current.setEmail('newuser@example.com');
      result.current.setPassword('SecurePass123!');
      result.current.setDisplayName('Alice Johnson');
    });

    const form = document.createElement('form');
    const formEvent = new Event('submit', { bubbles: true });
    formEvent.preventDefault = vi.fn();

    // Step 2: User submits signup form
    await act(async () => {
      await result.current.handleEmailAuth(formEvent as any);
    });

    // Step 3: Verify Firebase Auth was called
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'newuser@example.com',
      'SecurePass123!'
    );

    // Step 4: Verify updateProfile was called with displayName
    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(
      mockUserCredential.user,
      { displayName: 'Alice Johnson' }
    );

    // Step 5: Verify database save was called (FIX REQUIRED)
    expect(apiService.saveUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'Alice Johnson',
      })
    );

    // Step 6: Verify no error message
    expect(result.current.error).toBeNull();
  });
});

// ============================================================================
// TEST-008: Sign In vs Sign Up
// ============================================================================

describe('useLogin - TEST-008: Sign In vs Sign Up', () => {
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
