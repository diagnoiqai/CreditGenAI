/**
 * API Service Test Suite - getLeads()
 * Test Cases: 14 | Bug: BUG-001 (Duplicate Leads) | Feature: Pagination
 * 
 * BUG DETAILS:
 * Root Cause: LEFT JOIN in SQL query returns multiple rows per user
 * Fix: Set-based deduplication by UID, keep first entry per user
 * 
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║ TEST CASE SUMMARY TABLE                                                       ║
 * ╠════╦══════════════════════════════════════╦═════════════════╦═════════════════╣
 * ║ ID ║ Test Name                            ║ Category        ║ Expected Result ║
 * ╠════╬══════════════════════════════════════╬═════════════════╬═════════════════╣
 * ║ 001║ Clean API response (no duplicates)   ║ Deduplication   ║ 2 leads, 0 skip ║
 * ║ 002║ Duplicate leads (same UID)           ║ Deduplication   ║ 1 lead, 1 skip  ║
 * ║ 003║ Multiple users with duplicates       ║ Deduplication   ║ 2 leads, 2 skip ║
 * ║ 004║ Heavy duplicates (1 user, 3 apps)    ║ Deduplication   ║ 1 lead, 2 skip  ║
 * ║ 005║ Unique users (no dedup needed)       ║ Deduplication   ║ 2 leads, 0 skip ║
 * ║ 006║ Empty response                       ║ Edge Case       ║ 0 leads, ok     ║
 * ║ 007║ API error (network failure)          ║ Error Handling  ║ fallback, empty ║
 * ║ 008║ Pagination parameters (p,sz)         ║ Pagination      ║ params passed   ║
 * ║ 009║ Large dataset (5 users, 10 apps)     ║ Edge Case       ║ 5 leads, 5 skip ║
 * ║ 010║ Null/undefined fields                ║ Edge Case       ║ no crashes      ║
 * ║ 011║ Special characters in names          ║ Edge Case       ║ preserved       ║
 * ║ 012║ Malformed attachments                ║ Edge Case       ║ graceful handle ║
 * ║ 013║ Case-sensitive UID comparison        ║ Edge Case       ║ 2 leads (diff)  ║
 * ║ 014║ Last page with partial results       ║ Pagination      ║ correct count   ║
 * ╚════╩══════════════════════════════════════╩═════════════════╩═════════════════╝
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiService } from "../../src/services/apiService";

// ============================================================================
// TEST SETUP AND MOCKING
// ============================================================================

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockClear();
  vi.spyOn(console, "error").mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API Service - getLeads()", () => {
  // TEST-001: Clean API response (no duplicates)
  it("TEST-001: Should handle clean API response without duplicates", async () => {
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

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ 
        data: cleanResponse,
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].uid).toBe("user-001");
    expect(result.data[1].uid).toBe("user-002");
    expect(result.data[0].userName).toBe("John Doe");
    expect(result.data[1].userName).toBe("Jane Smith");
    expect(result.pagination).toBeDefined();
    expect(result.pagination.totalCount).toBe(2);
    expect(result.pagination.page).toBe(1);
  });

  // TEST-002: Duplicate leads (same UID)
  it("TEST-002: Should deduplicate when API returns duplicate UIDs", async () => {
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

    const consoleSpy = vi.spyOn(console, "log");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: duplicateResponse,
        pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].uid).toBe("user-001");
    expect(result.data[0].userName).toBe("John Doe");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[BUG-001 FIX] Skipping duplicate lead"),
    );
  });

  // TEST-003: Multiple users with duplicates
  it("TEST-003: Should deduplicate across multiple users", async () => {
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

    const consoleSpy = vi.spyOn(console, "log");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: multiUserDuplicates,
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].userName).toBe("John Doe");
    expect(result.data[1].userName).toBe("Jane Smith");

    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(2);
  });

  // TEST-004: Heavy duplicates (1 user, 3 apps)
  it("TEST-004: Should handle heavy duplicates - single user 3 apps", async () => {
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

    const consoleSpy = vi.spyOn(console, "log");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: heavyDuplicates,
        pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].uid).toBe("user-001");
    expect(result.data[0].userName).toBe("John Doe");
    expect(result.data[0].bankName).toBe("HDFC Bank");

    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(2);
  });

  // TEST-005: Unique users (no deduplication needed)
  it("TEST-005: Should return all leads when all UIDs are unique", async () => {
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

    const consoleSpy = vi.spyOn(console, "log");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: uniqueUsers,
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(2);
    expect(result.data[0].uid).toBe("user-001");
    expect(result.data[1].uid).toBe("user-002");

    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages).toHaveLength(0);
  });

  // TEST-006: Empty response
  it("TEST-006: Should handle empty response gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [],
        pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }
      }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalCount).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  // TEST-007: API error (network failure)
  it("TEST-007: Should handle API errors gracefully", async () => {
    const errorSpy = vi.spyOn(console, "error");

    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(0);
    expect(result.pagination.totalCount).toBe(0);
    expect(errorSpy).toHaveBeenCalled();
  });

  // TEST-008: Pagination parameters (page, pageSize)
  it("TEST-008: Should pass pagination parameters to API", async () => {
    const testData = [
      { id: "app-1", uid: "user-001", bank_id: "hdfc", bank_name: "HDFC Bank", loan_amount: "500000", loan_type: "Personal Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-15T10:30:00Z", user_name: "John", user_email: "john@test.com", user_mobile: "+919876543210", attachments: [] },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: testData, pagination: { totalCount: 100, page: 2, pageSize: 10, totalPages: 10 } }),
    });

    const result = await apiService.getLeads(2, 10);

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/leads?page=2&pageSize=10");
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.pageSize).toBe(10);
  });

  // TEST-009: Large dataset (5 users, 10 apps)
  it("TEST-009: Should handle large dataset with mixed duplicates", async () => {
    const largeDataset = [
      { id: "app-1", uid: "user-001", bank_id: "hdfc", bank_name: "HDFC Bank", loan_amount: "500000", loan_type: "Personal Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-15T10:30:00Z", user_name: "User 1", user_email: "user1@test.com", user_mobile: "+911111111111", attachments: [] },
      { id: "app-2", uid: "user-001", bank_id: "icici", bank_name: "ICICI Bank", loan_amount: "750000", loan_type: "Home Loan", status: "pending", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-16T14:20:00Z", user_name: "User 1", user_email: "user1@test.com", user_mobile: "+911111111111", attachments: [] },
      { id: "app-3", uid: "user-002", bank_id: "sbi", bank_name: "SBI Bank", loan_amount: "1000000", loan_type: "Home Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-17T09:15:00Z", user_name: "User 2", user_email: "user2@test.com", user_mobile: "+912222222222", attachments: [] },
      { id: "app-4", uid: "user-002", bank_id: "axis", bank_name: "Axis Bank", loan_amount: "600000", loan_type: "Personal Loan", status: "rejected", sub_status: null, status_notes: null, rejection_reason: "High debt", timestamp: "2024-01-18T11:45:00Z", user_name: "User 2", user_email: "user2@test.com", user_mobile: "+912222222222", attachments: [] },
      { id: "app-5", uid: "user-003", bank_id: "hdfc", bank_name: "HDFC Bank", loan_amount: "300000", loan_type: "Personal Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-19T13:00:00Z", user_name: "User 3", user_email: "user3@test.com", user_mobile: "+913333333333", attachments: [] },
      { id: "app-6", uid: "user-003", bank_id: "icici", bank_name: "ICICI Bank", loan_amount: "450000", loan_type: "Personal Loan", status: "pending", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-20T15:30:00Z", user_name: "User 3", user_email: "user3@test.com", user_mobile: "+913333333333", attachments: [] },
      { id: "app-7", uid: "user-004", bank_id: "sbi", bank_name: "SBI Bank", loan_amount: "800000", loan_type: "Home Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-21T10:00:00Z", user_name: "User 4", user_email: "user4@test.com", user_mobile: "+914444444444", attachments: [] },
      { id: "app-8", uid: "user-005", bank_id: "hdfc", bank_name: "HDFC Bank", loan_amount: "550000", loan_type: "Personal Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-22T12:15:00Z", user_name: "User 5", user_email: "user5@test.com", user_mobile: "+915555555555", attachments: [] },
      { id: "app-9", uid: "user-005", bank_id: "axis", bank_name: "Axis Bank", loan_amount: "400000", loan_type: "Personal Loan", status: "pending", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-23T14:45:00Z", user_name: "User 5", user_email: "user5@test.com", user_mobile: "+915555555555", attachments: [] },
      { id: "app-10", uid: "user-005", bank_id: "icici", bank_name: "ICICI Bank", loan_amount: "700000", loan_type: "Home Loan", status: "rejected", sub_status: null, status_notes: null, rejection_reason: "Low income", timestamp: "2024-01-24T16:20:00Z", user_name: "User 5", user_email: "user5@test.com", user_mobile: "+915555555555", attachments: [] },
    ];

    const consoleSpy = vi.spyOn(console, "log");

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: largeDataset, pagination: { totalCount: 5, page: 1, pageSize: 20, totalPages: 1 } }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(5);
    expect(result.pagination.totalCount).toBe(5);

    const skipMessages = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes("[BUG-001 FIX]"),
    );
    expect(skipMessages.length).toBeGreaterThan(0);
  });

  // TEST-010: Null/undefined fields
  it("TEST-010: Should handle null and undefined fields", async () => {
    const dataWithNulls = [
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
        timestamp: null,
        user_name: "John",
        user_email: null,
        user_mobile: null,
        attachments: null,
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: dataWithNulls, pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 } }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].subStatus).toBeNull();
    expect(result.data[0].statusNotes).toBeNull();
    expect(result.data[0].rejectionReason).toBeNull();
    expect(result.data[0].userEmail).toBeNull();
  });

  // TEST-011: Special characters in names
  it("TEST-011: Should handle special characters in user names", async () => {
    const specialCharData = [
      {
        id: "app-1",
        uid: "user-001",
        bank_id: "hdfc",
        bank_name: "HDFC Bank",
        loan_amount: "500000",
        loan_type: "Personal Loan",
        status: "approved",
        sub_status: null,
        status_notes: "Approved with 'quoted' text & symbols",
        rejection_reason: null,
        timestamp: "2024-01-15T10:30:00Z",
        user_name: "José García-López",
        user_email: "jose@example.com",
        user_mobile: "+919876543210",
        attachments: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: specialCharData, pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 } }),
    });

    const result = await apiService.getLeads();

    expect(result.data[0].userName).toBe("José García-López");
    expect(result.data[0].statusNotes).toContain("'quoted'");
  });

  // TEST-012: Malformed attachments
  it("TEST-012: Should handle malformed attachments", async () => {
    const malformedData = [
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
        user_name: "John",
        user_email: "john@test.com",
        user_mobile: "+919876543210",
        attachments: [
          { id: "att-1", file_url: "url-1", file_name: "doc1.pdf", file_type: "pdf", created_at: "2024-01-15" },
          { id: "att-2", file_url: null, file_name: null }, // Missing fields
        ],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: malformedData, pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 } }),
    });

    const result = await apiService.getLeads();

    expect(result.data[0].attachments).toBeDefined();
    expect(result.data[0].attachments).toHaveLength(2);
    expect(result.data[0].attachments![0].fileName).toBe("doc1.pdf");
  });

  // TEST-013: Case-sensitive UID comparison
  it("TEST-013: Should treat different case UIDs as different users", async () => {
    const caseData = [
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
        user_name: "User One",
        user_email: "user@test.com",
        user_mobile: "+911111111111",
        attachments: [],
      },
      {
        id: "app-2",
        uid: "USER-001", // Different case
        bank_id: "icici",
        bank_name: "ICICI Bank",
        loan_amount: "750000",
        loan_type: "Home Loan",
        status: "pending",
        sub_status: null,
        status_notes: null,
        rejection_reason: null,
        timestamp: "2024-01-16T14:20:00Z",
        user_name: "User One",
        user_email: "user@test.com",
        user_mobile: "+911111111111",
        attachments: [],
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: caseData, pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 } }),
    });

    const result = await apiService.getLeads();

    expect(result.data).toHaveLength(2);
  });

  // TEST-014: Last page with partial results
  it("TEST-014: Should handle last page with partial results", async () => {
    const lastPageData = [
      { id: "app-1", uid: "user-001", bank_id: "hdfc", bank_name: "HDFC Bank", loan_amount: "500000", loan_type: "Personal Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-15T10:30:00Z", user_name: "User 1", user_email: "user1@test.com", user_mobile: "+911111111111", attachments: [] },
      { id: "app-2", uid: "user-002", bank_id: "icici", bank_name: "ICICI Bank", loan_amount: "750000", loan_type: "Home Loan", status: "pending", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-16T14:20:00Z", user_name: "User 2", user_email: "user2@test.com", user_mobile: "+912222222222", attachments: [] },
      { id: "app-3", uid: "user-003", bank_id: "sbi", bank_name: "SBI Bank", loan_amount: "1000000", loan_type: "Home Loan", status: "approved", sub_status: null, status_notes: null, rejection_reason: null, timestamp: "2024-01-17T09:15:00Z", user_name: "User 3", user_email: "user3@test.com", user_mobile: "+913333333333", attachments: [] },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: lastPageData, pagination: { totalCount: 23, page: 3, pageSize: 10, totalPages: 3 } }),
    });

    const result = await apiService.getLeads(3, 10);

    expect(result.data).toHaveLength(3);
    expect(result.pagination.page).toBe(3);
    expect(result.pagination.totalCount).toBe(23);
    expect(result.pagination.totalPages).toBe(3);
  });
});

