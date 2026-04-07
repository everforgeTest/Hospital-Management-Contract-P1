const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

/**
 * SharedService
 *  - Centralized utilities used across the contract.
 *  - Holds the HotPocket contract context (set once in startup.js).
 *  - Exposes a common EventEmitter for intra-round NPL message routing.
 *
 * Notes on HotPocket context (ctx):
 *  - Valid properties include:
 *      ctx.users, ctx.unl, ctx.readonly, ctx.timestamp, ctx.publicKey, ctx.privateKey
 *  - SharedService.context is set in startup.js as: SharedService.context = ctx;
 *  - ctx.timestamp is a number (unix ms) and is consistent across nodes in a round.
 */
class SharedService {
  /**
   * HotPocket contract context. Must be assigned during startup.
   * Example: in startup.js => SharedService.context = ctx;
   * @type {{users: object, unl: object, readonly: boolean, timestamp: number, publicKey: string, privateKey: string}|null}
   */
  static context = null;

  /**
   * Event emitter for broadcasting/consuming NPL messages among services.
   * startup.js wires ctx.unl.onMessage(...) to emit on this emitter.
   * Consumers listen using: SharedService.nplEventEmitter.on(eventType, handler)
   */
  static nplEventEmitter = new EventEmitter();

  /**
   * Generate a RFC4122 v4 UUID.
   * @returns {string} UUID string, e.g., '550e8400-e29b-41d4-a716-446655440000'
   */
  static generateUUID() {
    return uuidv4();
  }

  /**
   * Convert a unix timestamp in milliseconds to an ISO 8601 UTC string.
   * @param {number} milliseconds - Unix epoch in milliseconds.
   * @returns {string} ISO string (e.g., '2023-10-04T05:59:42.384Z').
   */
  static getUtcISOStringFromUnixTimestamp(milliseconds) {
    const date = new Date(milliseconds);
    return date.toISOString();
  }

  /**
   * Get current context timestamp as ISO 8601 string.
   * Requires SharedService.context to be initialized.
   * @returns {string} ISO string based on ctx.timestamp.
   */
  static getCurrentTimestamp() {
    return SharedService.getUtcISOStringFromUnixTimestamp(SharedService.context.timestamp);
  }

  /**
   * Generate a concurrency key derived from the current round timestamp.
   * - Extracts digits from the ISO timestamp, converts to uppercase hex,
   *   left-pads to 14 characters, and prefixes with '0x'.
   * - Deterministic within a round (same ctx.timestamp across nodes),
   *   suitable for optimistic concurrency-like checks.
   * @returns {string} Concurrency key (e.g., '0x00ABCDEF123456').
   */
  static generateConcurrencyKey() {
    const timestamp = SharedService.getCurrentTimestamp();
    const extracted = timestamp.replace(/\D/g, '');
    const hex = Number(extracted).toString(16).toUpperCase().padStart(14, '0');
    const checksum = 16 - hex.length;
    return `0x${'0'.repeat(checksum)}${hex}`;
  }
}

module.exports = { SharedService };
//second comment
