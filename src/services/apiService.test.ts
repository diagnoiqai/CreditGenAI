/**
 * API Service Test Suite
 *
 * This file contains comprehensive test cases for src/services/apiService.ts
 * Primary focus: BUG-001 - Duplicate Leads Issue
 *
 * BUG-001 DETAILS:
 * ================
 * Root Cause: Backend SQL query uses LEFT JOIN which returns multiple rows per user
 *            (one row per application). When a user has 2+ applications, they appear
 *            multiple times in the leads list.
 *
 * Location: src/routes/adminRoutes.ts (line 104-157) - SQL query with LEFT JOIN
 *          src/services/apiService.ts (line 393-427) - getLeads() function
 *
 * Fix Applied: In getLeads() function, added Set-based deduplication logic:
 *             - Track seen UIDs in a Set
 *             - Filter: keep first entry per UID, skip duplicates
 *             - Console log when duplicates are skipped for verification
 *
 * Testing Strategy:
 * =================
 * TEST-001: Basic Duplicate - One user with 2 applications
 *           Expected: 1 lead returned (first app), duplicate skipped
 *           Console: [BUG-001 FIX] Skipping duplicate lead message
 *
 * TEST-002: Multiple Users - 2 users with 4 total applications (2 each)
 *           Expected: 2 leads returned (1 per user), duplicates skipped
 *           Console: 2x skip messages
 *
 * TEST-003: Heavy Duplicates - 1 user with 3 applications
 *           Expected: 1 lead returned, 2 duplicates skipped
 *           Console: 2x skip messages
 *
 * TEST-004: Unique Users - 2 users with 1 app each
 *           Expected: 2 leads returned, no filtering
 *           Console: No skip messages
 *
 * TEST-005: Empty Response - API returns empty array
 *           Expected: Empty array returned, no errors
 *           Console: No messages
 *
 * TEST-006: Error Handling - API returns error/fails
 *           Expected: Empty array returned (graceful fallback)
 *           Console: Error logged
 *
 * Manual Verification Steps:
 * ==========================
 * 1. Run: npm run dev
 * 2. Go to Admin Panel → Leads View
 * 3. Search for user that has multiple applications: e.g., "John Doe"
 * 4. Verification: Should see John Doe once, not multiple times
 * 5. Check Browser Console (F12): Look for [BUG-001 FIX] messages
 * 6. If you see [BUG-001 FIX] logs appearing multiple times, the fix is working
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiService } from "./apiService";

// ============================================================================
// TEST SETUP AND MOCKING
// ============================================================================

/**
 * Mock fetch function globally before tests run
 * This allows us to simulate API responses without making real network calls
 */
global.fetch = vi.fn();

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  // Clear console logs to start fresh
  vi.spyOn(console, "log").mockClear();
  vi.spyOn(console, "error").mockClear();
});

afterEach(() => {
  // Restore console after each test
  vi.restoreAllMocks();
});

// ============================================================================
// TEST-001: Handle Clean API Response (No Duplicates)
// ============================================================================

/**
 * SCENARIO: API returns 2 different users, each with 1 application
 * PURPOSE: Verify that unique leads pass through without filtering
 * EXPECTED: All 2 leads returned, no skip messages
 */
describe("API Service - getLeads()", () => {
  it("TEST-001: Should handle clean API response without duplicates", async () => {
    // SETUP: Mock data - 2 users, 2 apps, no duplicates
    const cleanResponse = [
      {
        id: "app-1",
        uid: "user-001",
        bank_id: "hdfc",
        bank_name: "HDFC Bank",
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "user-002",
        bank_id: "icici",
        bank_name: "ICICI Bank",
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "Jane Smith",
        user_email: "jane@example.com",
        user_mobile: "+918765432109",
        attachments: [],
      },
    ];

    // Mock the fetch to return successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => cleanResponse,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY
    expect(result).toHaveLength(2); // Both leads should be returned
    expect(result[0].uid).toBe("user-001");
    expect(result[1].uid).toBe("user-002");
    expect(result[0].userName).toBe("John Doe");
    expect(result[1].userName).toBe("Jane Smith");

    // MANUAL CHECK: In UI, you should see both users listed, each appearing once
    // CONSOLE CHECK: No [BUG-001 FIX] messages should appear (no duplicates to skip)
  });

  // ========================================================================
  // TEST-002: Detect and Remove Duplicate Leads (Main Bug Fix Test)
  // ========================================================================

  /**
   * SCENARIO: API returns duplicate UIDs (same user, multiple applications)
   * This is the core test for BUG-001 fix
   * PURPOSE: Verify that duplicates are detected and removed
   * EXPECTED: Only 1 lead per UID, duplicates skipped, console messages logged
   */
  it("TEST-002: Should deduplicate when API returns duplicate UIDs", async () => {
    // SETUP: Mock data - John Doe appears twice (2 applications)
    // This simulates the actual bug: LEFT JOIN creates multiple rows per user
    const duplicateResponse = [
      {
        id: "app-1",
        uid: "user-001", // Same UID as next entry
        bank_id: "hdfc",
        bank_name: "HDFC Bank",
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "user-001", // DUPLICATE: Same user, different application
        bank_id: "icici",
        bank_name: "ICICI Bank",
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
    ];

    // Mock console.log to track skip messages
    const consoleSpy = vi.spyOn(console, "log");

    // Mock the fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => duplicateResponse,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: Only 1 lead should be returned (duplicate removed)
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe("user-001");
    expect(result[0].userName).toBe("John Doe");

    // VERIFY: Console should show skip message for duplicate
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[BUG-001 FIX] Skipping duplicate lead"),
    );

    // MANUAL CHECK: In Leads View, John Doe should appear ONCE, not twice
    // CONSOLE CHECK: Browser console should show: [BUG-001 FIX] Skipping duplicate lead: John Doe (UID: user-001)
  });

  // ========================================================================
  // TEST-003: Multiple Users with Duplicates
  // ========================================================================

  /**
   * SCENARIO: 2 users, 4 applications total (each user has 2 apps)
   * PURPOSE: Verify deduplication works across multiple users
   * EXPECTED: 2 leads returned (1 per user), 2 duplicates skipped
   */
  it("TEST-003: Should deduplicate across multiple users", async () => {
    // SETUP: 2 users, each appearing twice
    const multiUserDuplicates = [
      {
        id: "app-1",
        uid: "user-001",
        bank_id: "hdfc",
        bank_name: "HDFC Bank",
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "user-001", // Duplicate John Doe
        bank_id: "icici",
        bank_name: "ICICI Bank",
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-3",
        uid: "user-002",
        bank_id: "sbi",
        bank_name: "SBI Bank",
        loan_amount: "1000000",
        loan_type: "Home Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-17T09:15:00Z",
        user_name: "Jane Smith",
        user_email: "jane@example.com",
        user_mobile: "+918765432109",
        attachments: [],
      },
      {
        id: "app-4",
        uid: "user-002", // Duplicate Jane Smith
        bank_id: "axis",
        bank_name: "Axis Bank",
        loan_amount: "600000",
        loan_type: "Personal Loan",
        status: "rejected",
        sub_status: null,
        status_notes: null,
        rejection_reason: "High debt ratio",
        timestamp: "2024-01-18T11:45:00Z",
        user_name: "Jane Smith",
        user_email: "jane@example.com",
        user_mobile: "+918765432109",
        attachments: [],
      },
    ];

    // Mock console to count skip messages
    const consoleSpy = vi.spyOn(console, "log");

    // Mock fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => multiUserDuplicates,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: 2 leads returned (one per user)
    expect(result).toHaveLength(2);
    expect(result[0].userName).toBe("John Doe");
    expect(result[1].userName).toBe("Jane Smith");

    // VERIFY: 2 skip messages (one for each duplicate)
    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(2); // Two duplicates skipped

    // MANUAL CHECK: Leads View should show 2 users total, John Doe once, Jane Smith once
    // CONSOLE CHECK: 2x [BUG-001 FIX] messages in browser console
  });

  // ========================================================================
  // TEST-004: Heavy Duplicates (Single User, 3 Applications)
  // ========================================================================

  /**
   * SCENARIO: One user with 3 different applications
   * PURPOSE: Verify the deduplication keeps ONLY the first entry
   * EXPECTED: 1 lead returned, 2 duplicates skipped, ensures first bank shown
   */
  it("TEST-004: Should handle heavy duplicates - single user 3 apps", async () => {
    // SETUP: Same user, 3 applications
    const heavyDuplicates = [
      {
        id: "app-1",
        uid: "user-001",
        bank_id: "hdfc",
        bank_name: "HDFC Bank", // This should be kept (first entry)
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "user-001", // Duplicate 1
        bank_id: "icici",
        bank_name: "ICICI Bank", // This will be skipped
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-3",
        uid: "user-001", // Duplicate 2
        bank_id: "sbi",
        bank_name: "SBI Bank", // This will be skipped
        loan_amount: "600000",
        loan_type: "Personal Loan",
        status: "rejected",
        sub_status: null,
        status_notes: null,
        rejection_reason: "High debt ratio",
        timestamp: "2024-01-17T09:15:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
    ];

    // Mock console to verify skip count
    const consoleSpy = vi.spyOn(console, "log");

    // Mock fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => heavyDuplicates,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: Only 1 lead returned
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe("user-001");
    expect(result[0].userName).toBe("John Doe");

    // VERIFY: First bank (HDFC) is kept
    expect(result[0].bankName).toBe("HDFC Bank");

    // VERIFY: 2 skip messages (for 2nd and 3rd applications)
    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(2);

    // MANUAL CHECK: Only John Doe appears once, with HDFC Bank shown
    // CONSOLE CHECK: 2x skip messages for ICICI and SBI
  });

  // ========================================================================
  // TEST-005: Unique Users (No Deduplication Needed)
  // ========================================================================

  /**
   * SCENARIO: 2 different users, each with 1 application (perfect data)
   * PURPOSE: Verify that clean data passes through without false filters
   * EXPECTED: All leads returned, no skip messages, no console spam
   */
  it("TEST-005: Should return all leads when all UIDs are unique", async () => {
    // SETUP: 2 users, no duplicates
    const uniqueUsers = [
      {
        id: "app-1",
        uid: "user-001",
        bank_id: "hdfc",
        bank_name: "HDFC Bank",
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "John Doe",
        user_email: "john@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "user-002",
        bank_id: "icici",
        bank_name: "ICICI Bank",
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "Jane Smith",
        user_email: "jane@example.com",
        user_mobile: "+918765432109",
        attachments: [],
      },
    ];

    // Mock console
    const consoleSpy = vi.spyOn(console, "log");

    // Mock fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => uniqueUsers,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: Both leads returned
    expect(result).toHaveLength(2);
    expect(result[0].uid).toBe("user-001");
    expect(result[1].uid).toBe("user-002");

    // VERIFY: No skip messages (no duplicates)
    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(0);

    // MANUAL CHECK: Both users visible, each once, all data correct
    // CONSOLE CHECK: No [BUG-001 FIX] messages (data is clean)
  });

  // ========================================================================
  // TEST-006: Empty Response (API Returns No Data)
  // ========================================================================

  /**
   * SCENARIO: API returns empty array
   * PURPOSE: Verify graceful handling of empty data
   * EXPECTED: Empty array returned, no errors, deduplication logic doesn't break
   */
  it("TEST-006: Should handle empty API response", async () => {
    // SETUP: Empty data
    const emptyResponse: any[] = [];

    // Mock fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => emptyResponse,
    });

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: Empty array returned
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);

    // MANUAL CHECK: Leads View shows "No leads" or empty state
    // Expected behavior: App doesn't crash, shows user-friendly empty message
  });

  // ========================================================================
  // TEST-007: Error Handling (API Failure)
  // ========================================================================

  /**
   * SCENARIO: API request fails (500 error, network error, etc.)
   * PURPOSE: Verify graceful error handling and fallback behavior
   * EXPECTED: Empty array returned, error logged, app doesn't crash
   */
  it("TEST-007: Should handle API errors gracefully", async () => {
    // Mock console error
    const errorSpy = vi.spyOn(console, "error");

    // Mock fetch to throw error
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    // EXECUTE
    const result = await apiService.getLeads();

    // VERIFY: Empty array returned (graceful fallback)
    expect(result).toEqual([]);

    // VERIFY: Error logged
    expect(errorSpy).toHaveBeenCalledWith(
      "API Error (getLeads):",
      expect.any(Error),
    );

    // MANUAL CHECK: App shows empty state or error message, doesn't crash
    // Console shows: API Error (getLeads): Error: Network error
  });

  // ========================================================================
  // TEST-008: Limit Parameter
  // ========================================================================

  /**
   * SCENARIO: getLeads() called with custom limit parameter
   * PURPOSE: Verify that limit parameter is passed correctly to API
   * EXPECTED: Fetch URL includes ?limit=50 parameter
   */
  it("TEST-008: Should pass limit parameter to API", async () => {
    // SETUP: Empty response (just testing the fetch call)
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => [],
    });

    // EXECUTE with custom limit
    await apiService.getLeads(50);

    // VERIFY: Fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/leads?limit=50");
  });
});

// ============================================================================
// BUG-001 VERIFICATION CHECKLIST
// ============================================================================

/**
 * HOW TO VERIFY THE BUG FIX IN PRODUCTION:
 *
 * QUICK TEST (30 seconds):
 * ========================
 * 1. npm run dev
 * 2. Go to Admin → Leads
 * 3. Open browser console (F12)
 * 4. Search for any user with multiple applications
 * 5. Check: Does user appear only once? YES = Fix works ✓
 * 6. Check Console: See [BUG-001 FIX] messages appearing? YES = Fix active ✓
 *
 * DETAILED TEST (10 minutes):
 * ===========================
 * 1. Clear browser cache and localStorage (or use incognito)
 * 2. npm run dev
 * 3. Admin login
 * 4. Go to Leads View
 * 5. For each user in the list:
 *    - Click on them to see profile
 *    - Check if they appear multiple times in list = FAIL
 *    - They should appear only once = PASS
 * 6. Filter by different banks, check for duplicate users
 * 7. In browser console, look for [BUG-001 FIX] messages
 *    - If fix is working, you'll see: [BUG-001 FIX] Skipping duplicate lead: {name} (UID: {uid})
 *
 * TROUBLESHOOTING:
 * ================
 * If you see duplicate users in the list:
 *  1. Check console for errors
 *  2. Check if [BUG-001 FIX] messages appear
 *  3. If no messages: Fix might not be applied, check apiService.ts line 393
 *  4. Clear cache: Ctrl+Shift+Delete
 *  5. Restart dev server: Ctrl+C, then npm run dev
 *
 * SUCCESS SIGNS:
 * ==============
 * ✓ Each user appears only once in leads list
 * ✓ Browser console shows [BUG-001 FIX] messages when loading leads
 * ✓ No data is lost (user is shown with first application)
 * ✓ Leads View renders correctly and quickly
 * ✓ Search functionality works with non-duplicated results
 */

/**
 * TO RUN THESE TESTS:
 *
 * Once: npm test                    (run tests once)
 * Watch: npm run test:watch         (re-run on file changes)
 * UI: npm run test:ui               (interactive test dashboard)
 * Coverage: npm run test:coverage   (see code coverage %)
 *
 * Individual test: npm test -- -t "TEST-001"
 * Filter by name: npm test -- -t "duplicate"
 */
