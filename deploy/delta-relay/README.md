# Delta fixed-IP relay — prepared, not deployed

Runs on a dedicated Linux server with a fixed outbound IPv4. Keep the Site owner-private. Public market data continues directly from Delta's WebSocket; the relay is for authenticated account calls only.

1. Provision a server with a stable outbound IP and Node 22+; enable time synchronization. Verify the IP actually used for outbound requests (a reserved inbound IP alone is not proof of outbound routing). Allowlist that IP in the Delta India API key settings.
2. Run `server.mjs` as an unprivileged systemd service, restarting on failure. Set a random, minimum 32-character `RELAY_TOKEN` in a root-owned environment file outside the repository (mode 0600). Bind stays at localhost:8788.
3. Terminate HTTPS with Caddy or nginx on an owned hostname, forwarding to localhost:8788. Require valid TLS; disable request/header/body logging. Firewall the host, exposing only HTTPS and restricted administration. Never expose the localhost port directly.
4. Set Site runtime secrets `DELTA_RELAY_URL` (HTTPS origin with no path), `DELTA_RELAY_TOKEN` (same token), and optional nonsecret `DELTA_RELAY_EGRESS_IP` (verified outbound IP).
5. Verify a read-only account refresh. A configured route is not proof of connectivity; only a successful exchange response verifies access. Existing encrypted connections are reused. New connections are saved only after Delta verifies access.

The relay forwards only allowlisted account/order routes to the fixed Delta India hostname. It never receives the API secret, follows redirects, retries orders, or allows withdrawals. Authenticated order requests still require the site's existing review/confirmation. Network uncertainty remains blocked for reconciliation. Do not log credentials or upload environment files.

No server, IP, domain, or cloud billing was provisioned during this preparation. Deployment and a real account read remain pending cloud-account access and one-time Delta allowlisting.
