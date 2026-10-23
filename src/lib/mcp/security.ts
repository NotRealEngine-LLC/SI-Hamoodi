// HAMOODI SyntheTech Intelligence — SSRF Protection & Network Security
// Phase 08: Server-Side Request Forgery prevention

/**
 * Validate URL for SSRF protection
 * Blocks access to internal networks, cloud metadata, and private IPs
 */
export function validateUrlForSSRF(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Must be HTTP or HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost and loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost access is not allowed' };
    }

    // Block private IPv4 ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      
      // 10.0.0.0/8
      if (a === 10) {
        return { valid: false, error: 'Private IP address (10.0.0.0/8) is not allowed' };
      }
      
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { valid: false, error: 'Private IP address (172.16.0.0/12) is not allowed' };
      }
      
      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { valid: false, error: 'Private IP address (192.168.0.0/16) is not allowed' };
      }
      
      // 169.254.0.0/16 (link-local and cloud metadata)
      if (a === 169 && b === 254) {
        return { valid: false, error: 'Link-local address (169.254.0.0/16) is not allowed' };
      }
      
      // 127.0.0.0/8 (loopback)
      if (a === 127) {
        return { valid: false, error: 'Loopback address (127.0.0.0/8) is not allowed' };
      }
      
      // 0.0.0.0
      if (a === 0 && b === 0 && c === 0 && d === 0) {
        return { valid: false, error: 'Invalid IP address (0.0.0.0)' };
      }
    }

    // Block IPv6 private addresses
    if (hostname.includes(':')) {
      // fc00::/7 (unique local)
      if (hostname.startsWith('fc') || hostname.startsWith('fd')) {
        return { valid: false, error: 'Private IPv6 address is not allowed' };
      }
      
      // fe80::/10 (link-local)
      if (hostname.startsWith('fe80') || hostname.startsWith('fe9') || 
          hostname.startsWith('fea') || hostname.startsWith('feb')) {
        return { valid: false, error: 'Link-local IPv6 address is not allowed' };
      }
      
      // ::1 (loopback)
      if (hostname === '::1') {
        return { valid: false, error: 'IPv6 loopback address is not allowed' };
      }
    }

    // Block cloud metadata endpoints
    const blockedHostnames = [
      'metadata.google.internal',
      'metadata.goog',
      '169.254.169.254', // AWS/GCP/Azure metadata
      'metadata.internal',
    ];

    if (blockedHostnames.some(blocked => hostname.includes(blocked))) {
      return { valid: false, error: 'Cloud metadata endpoint access is not allowed' };
    }

    // Block userinfo in URL (credential leakage prevention)
    if (url.username || url.password) {
      return { valid: false, error: 'URLs with embedded credentials are not allowed' };
    }

    // In production, enforce HTTPS
    if (import.meta.env.PROD && url.protocol !== 'https:') {
      return { valid: false, error: 'HTTPS is required in production' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize URL to prevent redirect attacks
 */
export function sanitizeRedirectUrl(url: string, allowedOrigins: string[]): string | null {
  try {
    const parsedUrl = new URL(url);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(origin => {
      const allowedOrigin = new URL(origin);
      return parsedUrl.origin === allowedOrigin.origin;
    });

    if (!isAllowed) {
      return null;
    }

    // Remove dangerous parameters
    const searchParams = new URLSearchParams(parsedUrl.search);
    searchParams.delete('redirect');
    searchParams.delete('redirect_uri');
    searchParams.delete('return_to');
    searchParams.delete('next');

    parsedUrl.search = searchParams.toString();

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * Check if a hostname resolves to a private IP
 * This would require DNS resolution in a real implementation
 */
export async function isPrivateHostname(hostname: string): Promise<boolean> {
  // In a real implementation, this would perform DNS resolution
  // and check if the resolved IP is in a private range
  
  // For now, we rely on the hostname validation in validateUrlForSSRF
  return false;
}

/**
 * Rate limiting for external requests
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if a request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetAt) {
      // Reset window
      this.requests.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const record = this.requests.get(key);
    if (!record) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * Get reset time
   */
  getResetTime(key: string): number {
    const record = this.requests.get(key);
    return record?.resetAt || Date.now() + this.windowMs;
  }
}

/**
 * Timeout wrapper for fetch requests
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Bound response size checker
 */
export async function fetchWithSizeLimit(
  url: string,
  options: RequestInit & { maxSize?: number; timeout?: number } = {}
): Promise<Response> {
  const { maxSize = 10 * 1024 * 1024, timeout = 30000, ...fetchOptions } = options;

  const response = await fetchWithTimeout(url, { ...fetchOptions, timeout });

  // Check content length if available
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new Error(`Response size exceeds limit of ${maxSize} bytes`);
  }

  return response;
}
