import { isIP } from "node:net";

let warnedNoAddress = false;

/**
 * The client address that per-client rate limits count a request under, or
 * null when no trustworthy address is available.
 *
 * On Vercel the platform sets `x-real-ip` from the connection and overwrites
 * client-sent forwarding headers, so a client cannot choose it
 * (`ipAddress()` from @vercel/functions reads the same header). `VERCEL=1` is
 * only present when the project exposes System Environment Variables.
 *
 * Anywhere else (`next dev`, `next start`) these headers hold whatever the
 * client sent, so only a header named in TRUSTED_IP_HEADER is used: one that a
 * reverse proxy you run always overwrites, e.g. `x-real-ip` with nginx's
 * `proxy_set_header X-Real-IP $remote_addr;`.
 *
 * Returning null makes callers skip per-client limits rather than lump every
 * visitor into one shared bucket; the global budgets still apply.
 */
export function clientAddress(request: Request): string | null {
  const header =
    process.env.VERCEL === "1"
      ? "x-real-ip"
      : process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  const value = header ? request.headers.get(header)?.trim() : undefined;

  switch (value ? isIP(value) : 0) {
    case 4:
      return value as string;
    case 6:
      return ipv6Subnet(value as string);
    default:
      if (!warnedNoAddress && process.env.NODE_ENV === "production") {
        warnedNoAddress = true;
        console.warn(
          "Per-client rate limits are off: no trusted client IP header. " +
            "On Vercel, enable System Environment Variables; elsewhere set " +
            "TRUSTED_IP_HEADER."
        );
      }
      return null;
  }
}

/**
 * The /64 subnet of an IPv6 address. A subscriber is usually given a whole
 * /64 and can switch addresses inside it at will, so limits count the subnet.
 * IPv4-mapped addresses (`::ffff:203.0.113.7`, in any spelling) count as
 * their IPv4 address.
 */
function ipv6Subnet(ip: string): string {
  const address = ip.toLowerCase().split("%")[0];
  const [head, tail] = address.split("::");
  const headGroups = ipv6Groups(head);
  const tailGroups = ipv6Groups(tail);
  const groups =
    tail === undefined
      ? headGroups
      : [
          ...headGroups,
          ...Array<number>(8 - headGroups.length - tailGroups.length).fill(0),
          ...tailGroups,
        ];

  // IPv4-mapped (::ffff:a.b.c.d) and IPv4-translated (::ffff:0:a.b.c.d)
  // addresses, however they are spelled.
  const isIpv4 =
    groups.slice(0, 4).every((group) => group === 0) &&
    ((groups[4] === 0 && groups[5] === 0xffff) ||
      (groups[4] === 0xffff && groups[5] === 0));
  if (isIpv4) {
    return [
      groups[6] >> 8,
      groups[6] & 255,
      groups[7] >> 8,
      groups[7] & 255,
    ].join(".");
  }

  const prefix = groups
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(":");
  return `${prefix}::/64`;
}

/** The 16-bit groups of one side of an IPv6 address; a dotted IPv4 tail is two. */
function ipv6Groups(part: string | undefined): number[] {
  if (!part) return [];
  return part.split(":").flatMap((group) => {
    if (!group.includes(".")) return [Number.parseInt(group, 16)];
    const [a, b, c, d] = group.split(".").map(Number);
    return [(a << 8) | b, (c << 8) | d];
  });
}
