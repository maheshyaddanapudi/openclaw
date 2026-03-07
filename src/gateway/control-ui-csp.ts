export function buildControlUiCspHeader(): string {
  // Control UI: block framing, block inline scripts, keep styles permissive
  // (UI uses a lot of inline style attributes in templates).
  // Keep Google Fonts origins explicit in CSP for deployments that load
  // external Google Fonts stylesheets/font files.
  //
  // img-src: 'self' for local assets, data: for inline data URIs (avatars),
  // https: for remote avatar URLs from channel providers.
  //
  // connect-src: 'self' covers same-origin HTTP and WebSocket in modern browsers.
  // wss: is included for TLS WebSocket connections when accessed via HTTPS.
  // Bare ws: is intentionally omitted to prevent unencrypted WebSocket to arbitrary hosts.
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' wss:",
  ].join("; ");
}
