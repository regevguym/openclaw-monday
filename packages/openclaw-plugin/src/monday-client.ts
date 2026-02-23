/**
 * monday.com GraphQL HTTP client with authentication, rate limiting, and error handling.
 */

const MONDAY_API_URL = "https://api.monday.com/v2";
const API_VERSION = "2024-10";

export interface MondayClientConfig {
  apiToken: string;
  apiUrl?: string;
  apiVersion?: string;
  /** Max requests per minute (monday.com limit: 5000 complexity/min) */
  rateLimitPerMinute?: number;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    extensions?: Record<string, any>;
  }>;
  account_id?: number;
  complexity?: {
    before: number;
    after: number;
    query: number;
    reset_in_x_seconds: number;
  };
}

export class MondayApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors?: GraphQLResponse["errors"],
    public readonly complexity?: GraphQLResponse["complexity"]
  ) {
    super(message);
    this.name = "MondayApiError";
  }
}

export class RateLimitError extends MondayApiError {
  constructor(
    public readonly resetInSeconds: number
  ) {
    super(
      `Rate limit exceeded. Resets in ${resetInSeconds} seconds.`,
      429
    );
    this.name = "RateLimitError";
  }
}

export class MondayClient {
  private apiToken: string;
  private apiUrl: string;
  private apiVersion: string;
  private requestTimestamps: number[] = [];
  private rateLimitPerMinute: number;

  constructor(config: MondayClientConfig) {
    this.apiToken = config.apiToken;
    this.apiUrl = config.apiUrl ?? MONDAY_API_URL;
    this.apiVersion = config.apiVersion ?? API_VERSION;
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? 60;
  }

  /**
   * Execute a GraphQL query/mutation against the monday.com API.
   */
  async query<T = any>(
    queryStr: string,
    variables?: Record<string, any>
  ): Promise<T> {
    await this.enforceRateLimit();

    const body: Record<string, any> = { query: queryStr };
    if (variables && Object.keys(variables).length > 0) {
      body.variables = variables;
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.apiToken,
        "API-Version": this.apiVersion,
      },
      body: JSON.stringify(body),
    });

    // Handle HTTP-level errors
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") ?? "30", 10);
      throw new RateLimitError(retryAfter);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new MondayApiError(
        `HTTP ${response.status}: ${text}`,
        response.status
      );
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    // Handle GraphQL-level errors
    if (json.errors && json.errors.length > 0) {
      const msg = json.errors.map((e) => e.message).join("; ");

      // Check for complexity-based rate limiting
      if (json.complexity && json.complexity.after < 0) {
        throw new RateLimitError(json.complexity.reset_in_x_seconds);
      }

      throw new MondayApiError(msg, 200, json.errors, json.complexity ?? undefined);
    }

    if (!json.data) {
      throw new MondayApiError("No data returned from monday.com API", 200);
    }

    return json.data;
  }

  /**
   * Execute a query with automatic retry on rate limit errors.
   */
  async queryWithRetry<T = any>(
    queryStr: string,
    variables?: Record<string, any>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.query<T>(queryStr, variables);
      } catch (err) {
        if (err instanceof RateLimitError && attempt < maxRetries) {
          lastError = err;
          const waitMs = Math.min(err.resetInSeconds * 1000, 60_000);
          await this.sleep(waitMs);
          continue;
        }
        throw err;
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000;

    // Remove timestamps outside the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => ts > windowStart
    );

    if (this.requestTimestamps.length >= this.rateLimitPerMinute) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitMs = oldestInWindow - windowStart + 100; // +100ms buffer
      await this.sleep(waitMs);
    }

    this.requestTimestamps.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
