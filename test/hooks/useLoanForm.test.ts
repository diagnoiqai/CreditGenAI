/**
 * useLoanForm Hook Test Suite
 * Test Cases: 8 | Bug: BUG-002 (Age Field Default) | Feature: Form Validation
 * 
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║ TEST CASE SUMMARY TABLE                                                ║
 * ╠════╦══════════════════════════════════╦════════════╦════════════════════╣
 * ║ ID ║ Test Name                        ║ Category   ║ Expected Result    ║
 * ╠════╬══════════════════════════════════╬════════════╬════════════════════╣
 * ║ 001║ Age defaults to 18               ║ Default    ║ age === 18, number ║
 * ║ 002║ Age updates via slider           ║ Update     ║ age reflects input ║
 * ║ 003║ Validation fails (undefined age) ║ Validation ║ isValid = false    ║
 * ║ 004║ Validation passes (valid age)    ║ Validation ║ isValid = true     ║
 * ║ 005║ Age from initialProfile          ║ Init       ║ respects prop      ║
 * ║ 006║ Age is number type               ║ Type       ║ typeof = 'number'  ║
 * ║ 007║ Age within valid range (18-70)   ║ Range      ║ boundary check ok  ║
 * ║ 008║ Age persists across steps        ║ State      ║ survives navigation║
 * ╚════╩══════════════════════════════════╩════════════╩════════════════════╝
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLoanForm } from '../../src/hooks/useLoanForm';

const mockOnComplete = (profile: any) => {};

beforeEach(() => {});

describe('useLoanForm - Age Field (BUG-002)', () => {
  // TEST-001: Age defaults to 18
  it('TEST-001: Should initialize age to 18 by default', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    expect(result.current.formData.age).toBe(18);
    expect(typeof result.current.formData.age).toBe('number');
  });

  // TEST-002: Age updates via slider
  it('TEST-002: Should update age when slider changes', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 25));
    expect(result.current.formData.age).toBe(25);
    
    act(() => result.current.updateField('age', 45));
    expect(result.current.formData.age).toBe(45);
    
    act(() => result.current.updateField('age', 70));
    expect(result.current.formData.age).toBe(70);
  });

  // TEST-003: Validation fails (undefined age)
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

  // TEST-004: Validation passes (valid age)
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

  // TEST-005: Age from initialProfile
  it('TEST-005: Should preserve age from initialProfile', () => {
    const { result } = renderHook(() =>
      useLoanForm({
        onComplete: mockOnComplete,
        initialProfile: { age: 35 } as any,
      })
    );
    
    expect(result.current.formData.age).toBe(35);
  });

  // TEST-006: Age is number type
  it('TEST-006: Should maintain age as number type', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    expect(typeof result.current.formData.age).toBe('number');
    expect(result.current.formData.age).toBe(18);
    
    act(() => result.current.updateField('age', 30));
    expect(typeof result.current.formData.age).toBe('number');
    expect(result.current.formData.age).toBe(30);
  });

  // TEST-007: Age within valid range (18-70)
  it('TEST-007: Should maintain age within valid range', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 18));
    expect(result.current.formData.age).toBeGreaterThanOrEqual(18);
    
    act(() => result.current.updateField('age', 70));
    expect(result.current.formData.age).toBeLessThanOrEqual(70);
  });

  // TEST-008: Age persists across steps
  it('TEST-008: Should preserve age when navigating form steps', () => {
    const { result } = renderHook(() => useLoanForm({ onComplete: mockOnComplete }));
    
    act(() => result.current.updateField('age', 32));
    expect(result.current.formData.age).toBe(32);
    
    act(() => result.current.setStep(3));
    expect(result.current.formData.age).toBe(32);
  });
});
