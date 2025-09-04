/**
 * Generates a unique guest ID of the form:
 *   guest-YYYYMMDDHHMMSSmmm-XXXXXXXX
 * where:
 *   • YYYYMMDDHHMMSSmmm = UTC date/time to the millisecond
 *   • XXXXXXXX         = 8‑character random alphanumeric string
 * @returns {string}
 */
export default function generateGuestId() {
  // 1) Get the current UTC timestamp formatted as YYYYMMDDHHMMSSmmm
  const now = new Date();
  const pad = (n, size = 2) => n.toString().padStart(size, "0");
  const datePart = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join("") + pad(now.getUTCMilliseconds(), 3);

  // 2) Create a short random alphanumeric string
  const randomPart = Math.random()
    .toString(36)          // convert to base36 (0–9 + a–z)
    .substr(2, 8)          // skip “0.” and take 8 chars

  // 3) Combine them
  return `guest-${datePart}-${randomPart}`;
}
