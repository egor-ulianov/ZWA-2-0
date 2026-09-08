const CHANNEL = "zwa-playground";
const VERSION = 1;
const MAX_TEXT_LENGTH = 2000;
const MAX_MESSAGE_BYTES = 32768;
const MAX_COLLECTION_LENGTH = 64;
const MAX_VALUE_DEPTH = 5;
const MAX_TOKEN_LENGTH = 128;

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch (_) {
    return false;
  }
}

function isBoundedValue(value, depth = 0) {
  if (depth > MAX_VALUE_DEPTH) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.length <= MAX_TEXT_LENGTH;
  if (Array.isArray(value)) {
    return (
      value.length <= MAX_COLLECTION_LENGTH &&
      value.every((item) => isBoundedValue(item, depth + 1))
    );
  }
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  return (
    entries.length <= MAX_COLLECTION_LENGTH &&
    entries.every(
      ([key, item]) =>
        key.length <= 100 && isBoundedValue(item, depth + 1)
    )
  );
}

function hasBoundedEncoding(value) {
  try {
    const encoded = JSON.stringify(value);
    if (typeof encoded !== "string") return false;
    if (typeof TextEncoder === "function") {
      return new TextEncoder().encode(encoded).length <= MAX_MESSAGE_BYTES;
    }
    return encoded.length <= MAX_MESSAGE_BYTES;
  } catch (_) {
    return false;
  }
}

function hasExactKeys(value, keys) {
  const actualKeys = Object.keys(value);
  return (
    actualKeys.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function validatePlaygroundMessage(data, expectedToken) {
  if (
    !isPlainObject(data) ||
    typeof expectedToken !== "string" ||
    expectedToken.length === 0 ||
    expectedToken.length > MAX_TOKEN_LENGTH
  ) {
    return null;
  }
  if (
    data.channel !== CHANNEL ||
    data.version !== VERSION ||
    data.token !== expectedToken
  ) {
    return null;
  }
  if (data.type === "ready") {
    if (!hasExactKeys(data, ["channel", "version", "token", "type"])) {
      return null;
    }
    return hasBoundedEncoding(data) ? data : null;
  }
  if (data.type === "console") {
    if (!hasExactKeys(data, ["channel", "version", "token", "type", "level", "text"])) {
      return null;
    }
    if (!["log", "warn", "error"].includes(data.level)) return null;
    if (typeof data.text !== "string" || data.text.length > MAX_TEXT_LENGTH) {
      return null;
    }
    return hasBoundedEncoding(data) ? data : null;
  }
  if (data.type === "result") {
    if (!hasExactKeys(data, ["channel", "version", "token", "type", "value"])) {
      return null;
    }
    return hasBoundedEncoding(data) && isBoundedValue(data.value) ? data : null;
  }
  if (data.type === "error") {
    if (!hasExactKeys(data, ["channel", "version", "token", "type", "message"])) {
      return null;
    }
    if (
      typeof data.message !== "string" ||
      data.message.length > MAX_TEXT_LENGTH
    ) {
      return null;
    }
    return hasBoundedEncoding(data) ? data : null;
  }
  return null;
}

function validatePlaygroundEvent(event, expectedToken, expectedSource) {
  if (
    !event ||
    !expectedSource ||
    event.origin !== "null" ||
    event.source !== expectedSource
  ) {
    return null;
  }
  return validatePlaygroundMessage(event.data, expectedToken);
}

function createSandboxToken() {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : null;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const bytes = new Uint32Array(4);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16)).join("-");
  }
  throw new Error("Secure sandbox tokens require Web Crypto");
}

module.exports = {
  CHANNEL,
  VERSION,
  MAX_TEXT_LENGTH,
  MAX_TOKEN_LENGTH,
  validatePlaygroundEvent,
  validatePlaygroundMessage,
  createSandboxToken,
};
