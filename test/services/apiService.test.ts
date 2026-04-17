import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiService } from "../../src/services/apiService";

global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiService.getLeads", () => {
  it("handles clean response without duplicates", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [
          { id: "app-1", uid: "user-001", user_name: "John Doe", attachments: [] },
          { id: "app-2", uid: "user-002", user_name: "Jane Smith", attachments: [] }
        ],
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(2);
  });

  it("handles backend-deduplicated response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [{ id: "app-1", uid: "user-001", user_name: "John Doe", attachments: [] }],
        pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(1);
  });

  it("handles multiple deduplicated users", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [
          { id: "app-1", uid: "user-001", user_name: "John Doe", attachments: [] },
          { id: "app-3", uid: "user-002", user_name: "Jane Smith", attachments: [] }
        ],
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(2);
  });

  it("returns most recent application for single user", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [{ id: "app-2", uid: "user-001", bank_name: "ICICI Bank", attachments: [] }],
        pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(1);
  });

  it("handles unique users without duplication", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({
        data: [
          { id: "app-1", uid: "user-001", attachments: [] },
          { id: "app-2", uid: "user-002", attachments: [] }
        ],
        pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 }
      }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(2);
  });

  it("handles empty API response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [], pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(0);
  });

  it("handles large dataset", async () => {
    const largeData = Array.from({ length: 5 }, (_, i) => ({ id: `app-${i}`, uid: `user-${i}`, attachments: [] }));
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: largeData, pagination: { totalCount: 5, page: 1, pageSize: 20, totalPages: 1 } }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(5);
  });

  it("handles pagination parameters", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [{ id: "app-1", uid: "user-001", attachments: [] }], pagination: { totalCount: 100, page: 2, pageSize: 20, totalPages: 5 } }),
    });
    await apiService.getLeads(2, 20);
    expect((global.fetch as any).mock.calls[0][0]).toContain("page=2");
  });

  it("handles null fields gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [{ id: "app-1", uid: "user-001", bank_id: null, attachments: null }], pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 } }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(1);
  });

  it("preserves special characters in names", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [{ id: "app-1", uid: "user-001", user_name: "José García", attachments: [] }], pagination: { totalCount: 1, page: 1, pageSize: 20, totalPages: 1 } }),
    });
    const result = await apiService.getLeads();
    expect(result.data[0].userName).toBe("José García");
  });

  it("treats UIDs as case-sensitive", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [{ id: "app-1", uid: "user-001", attachments: [] }, { id: "app-2", uid: "USER-001", attachments: [] }], pagination: { totalCount: 2, page: 1, pageSize: 20, totalPages: 1 } }),
    });
    const result = await apiService.getLeads();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].uid).toBe("user-001");
    expect(result.data[1].uid).toBe("USER-001");
  });

  it("handles last page with partial results", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: async () => ({ data: [{ id: "app-1", uid: "user-001", attachments: [] }], pagination: { totalCount: 21, page: 2, pageSize: 20, totalPages: 2 } }),
    });
    const result = await apiService.getLeads(2, 20);
    expect(result.data).toHaveLength(1);
    expect(result.pagination.page).toBe(2);
  });
});

describe('apiService', () => {
    it('should be defined', () => {
        expect(apiService).toBeDefined();
    });
});
