import { expect, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Test Environment Setup
 * 
 * This file configures the test environment before any tests run.
 * It includes global test utilities and mocks for browser APIs.
 */

// Mock window.matchMedia for responsive component testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Extend expect with custom matchers if needed
expect.extend({});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
