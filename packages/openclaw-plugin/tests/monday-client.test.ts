/**
 * Unit tests for the monday.com GraphQL client.
 */

import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  MondayClient,
  MondayApiError,
  RateLimitError,
} from "../src/monday-client.js";

function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get: (key: string) => headers[key] ?? null,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

let fetchCalls: Array<{ url: string; init: any }> = [];
let fetchResponses: any[] = [];

// Replace global fetch with a mock
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init: any) => {
  fetchCalls.push({ url, init });
  const response = fetchResponses.shift();
  if (!response) throw new Error("No mock response configured");
  return response;
}) as any;

describe("MondayClient", () => {
  let client: MondayClient;

  beforeEach(() => {
    fetchCalls = [];
    fetchResponses = [];
    client = new MondayClient({
      apiToken: "test-token",
      rateLimitPerMinute: 1000,
    });
  });

  describe("query()", () => {
    it("should make a POST request with correct headers", async () => {
      fetchResponses.push(jsonResponse({ data: { boards: [] } }));

      await client.query("query { boards { id } }");

      assert.equal(fetchCalls.length, 1);
      assert.equal(fetchCalls[0].url, "https://api.monday.com/v2");
      assert.equal(fetchCalls[0].init.method, "POST");
      assert.equal(fetchCalls[0].init.headers["Content-Type"], "application/json");
      assert.equal(fetchCalls[0].init.headers["Authorization"], "test-token");
      assert.equal(fetchCalls[0].init.headers["API-Version"], "2024-10");
    });

    it("should include variables in the request body", async () => {
      fetchResponses.push(jsonResponse({ data: { boards: [{ id: "1" }] } }));

      await client.query("query ($id: [ID!]!) { boards(ids: $id) { id } }", {
        id: ["1"],
      });

      const body = JSON.parse(fetchCalls[0].init.body);
      assert.deepEqual(body.variables, { id: ["1"] });
    });

    it("should return data on success", async () => {
      const expected = { boards: [{ id: "1", name: "Test" }] };
      fetchResponses.push(jsonResponse({ data: expected }));

      const result = await client.query("query { boards { id name } }");
      assert.deepEqual(result, expected);
    });

    it("should throw MondayApiError on GraphQL errors", async () => {
      fetchResponses.push(
        jsonResponse({
          data: null,
          errors: [{ message: "Board not found" }],
        })
      );

      await assert.rejects(
        () => client.query("query { boards(ids: [999]) { id } }"),
        (err: any) => {
          assert.ok(err instanceof MondayApiError);
          assert.match(err.message, /Board not found/);
          return true;
        }
      );
    });

    it("should throw RateLimitError on HTTP 429", async () => {
      fetchResponses.push(jsonResponse({}, 429, { "Retry-After": "30" }));

      await assert.rejects(
        () => client.query("query { boards { id } }"),
        (err: any) => {
          assert.ok(err instanceof RateLimitError);
          assert.equal(err.resetInSeconds, 30);
          return true;
        }
      );
    });

    it("should throw RateLimitError on complexity exhaustion", async () => {
      fetchResponses.push(
        jsonResponse({
          data: null,
          errors: [{ message: "Complexity budget exhausted" }],
          complexity: {
            before: 100,
            after: -50,
            query: 150,
            reset_in_x_seconds: 25,
          },
        })
      );

      await assert.rejects(
        () => client.query("query { boards { id } }"),
        (err: any) => {
          assert.ok(err instanceof RateLimitError);
          assert.equal(err.resetInSeconds, 25);
          return true;
        }
      );
    });

    it("should throw MondayApiError on HTTP errors", async () => {
      fetchResponses.push(jsonResponse("Internal Server Error", 500));

      await assert.rejects(
        () => client.query("query { boards { id } }"),
        (err: any) => {
          assert.ok(err instanceof MondayApiError);
          assert.equal(err.statusCode, 500);
          return true;
        }
      );
    });

    it("should throw if no data returned", async () => {
      fetchResponses.push(jsonResponse({}));

      await assert.rejects(
        () => client.query("query { boards { id } }"),
        (err: any) => {
          assert.match(err.message, /No data returned/);
          return true;
        }
      );
    });
  });

  describe("queryWithRetry()", () => {
    it("should retry on rate limit errors", async () => {
      // First call: rate limit
      fetchResponses.push(jsonResponse({}, 429, { "Retry-After": "0" }));
      // Second call: success
      fetchResponses.push(jsonResponse({ data: { boards: [] } }));

      const result = await client.queryWithRetry("query { boards { id } }");
      assert.deepEqual(result, { boards: [] });
      assert.equal(fetchCalls.length, 2);
    });

    it("should throw after max retries", async () => {
      // All calls: rate limit
      for (let i = 0; i < 4; i++) {
        fetchResponses.push(jsonResponse({}, 429, { "Retry-After": "0" }));
      }

      await assert.rejects(
        () => client.queryWithRetry("query { boards { id } }", undefined, 3),
        (err: any) => {
          assert.ok(err instanceof RateLimitError);
          return true;
        }
      );
    });

    it("should not retry on non-rate-limit errors", async () => {
      fetchResponses.push(
        jsonResponse({
          data: null,
          errors: [{ message: "Invalid query" }],
        })
      );

      await assert.rejects(
        () => client.queryWithRetry("invalid"),
        (err: any) => {
          assert.ok(err instanceof MondayApiError);
          return true;
        }
      );
      assert.equal(fetchCalls.length, 1);
    });
  });
});
