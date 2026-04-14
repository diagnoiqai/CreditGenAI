/**
 * Loan Form Hook Test Suite
 *
 * This file contains comprehensive test cases for src/hooks/useLoanForm.ts
 * Primary focus: BUG-002 - Age Field Default Issue
 *
 * BUG-002 DETAILS:
 * ================
 * Root Cause: useLoanForm hook initializes formData state without age property.
 *            Age was missing from initial state object, causing it to be undefined
 *            on first load, even though UI displayed "18" as fallback.
 *
 * Fix Applied: Added age: initialProfile?.age || 18 to formData state initialization
 *             Ensures age is always a number (18-70), never undefined
 *
 * Testing Strategy:
 * =================
 * TEST-001: Age Defaults to 18 - formData.age === 18
 * TEST-002: Age Updates Correctly - updateField changes age
 * TEST-003: Age Validation Fails - validateStep rejects undefined age
 * TEST-004: Age Validation Passes - validateStep accepts valid age
 * TEST-005: Age from Initial Profile - respects initialProfile.age
 * TEST-006: Age is Number Type - typeof formData.age === 'number'
 * TEST-007: Age in Valid Range - 18-70 range maintained
 * TEST-008: Age Persists - survives step navigation
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLoanForm } from './useLoanForm';

const mockOnComplete = (profile: any) => {};

beforeEach(() => {});

describe('useLoanForm - Age Field Default (BUG-002)', () => {
  it('TEST-001: Should initialize age to 18 by default', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    expect(result.current.formData.age).toBe(18);
    expect(typeof result.current.formData.age).toBe('number');
  });

  it('TEST-002: Should update age when slider changes', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 25));
    expect(result.current.formData.age).toBe(25);
    
    act(() => result.current.updateField('age', 45));
    expect(result.current.formData.age).toBe(45);
    
    act(() => result.current.updateField('age', 70));
    expect(result.current.formData.age).toBe(70);
  });

  it('TEST-003: Should fail validation when age is undefined', () => {
    const { result } = renderHook(() =>
      useLoanForm({
        onComplete: mockOnComplete,
        initialProfile: { age: undefined } as any,
      })
    );
    
    act(() => result.current.setStep(3));
    const { isValid, newErrors } = result.current.validateStep();
    
    expect(isValid).toBe(false);
    expect(newErrors.age).toBe('Age is required');
  });

  it('TEST-004: Should pass validation when age is valid', () => {
    const { result } = renderHook(() =>
      useLoanForm({
        onComplete: mockOnComplete,
        initialProfile: {
          age: 25,
          gender: 'Male',
          city: 'Mumbai',
          maritalStatus: 'Single',
        } as any,
      })
    );
    
    act(() => result.current.setStep(3));
    const { isValid, newErrors } = result.current.validateStep();
    
    expect(isValid).toBe(true);
    expect(newErrors.age).toBeUndefined();
  });

  it('TEST-005: Should preserve age from initialProfile', () => {
    const { result } = renderHook(() =>
      useLoanForm({
        onComplete: mockOnComplete,
        initialProfile: { age: 35 } as any,
      })
    );
    
    expect(result.current.formData.age).toBe(35);
  });

  it('TEST-006: Should maintain age as number type', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    expect(typeof result.current.formData.age).toBe('number');
    expect(result.current.formData.age).toBe(18);
    
    act(() => result.current.updateField('age', 30));
    expect(typeof result.current.formData.age).toBe('number');
    expect(result.current.formData.age).toBe(30);
  });

  it('TEST-007: Should maintain age within valid range', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 18));
    expect(result.current.formData.age).toBeGreaterThanOrEqual(18);
    
    act(() => result.current.updateField('age', 70));
    expect(result.current.formData.age).toBeLessThanOrEqual(70);
  });

  it('TEST-008: Should preserve age when navigating form steps', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 32));
    expect(result.current.formData.age).toBe(32);
    
    act(() => result.current.setStep(3));
    expect(result.current.formData.age).toBe(32);
  });
});