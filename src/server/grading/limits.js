import { validateUsername } from '../repositories/validation.js';

export const GRADING_LIMITS = Object.freeze({
  maxImages: 4,
  maxImageBytes: 2 * 1024 * 1024,
  maxTotalImageBytes: 8 * 1024 * 1024,
  maxCriteriaChars: 2_000,
  maxReasoningChars: 4_000,
  maxPoints: 12,
  maxNormalizationItems: 500,
  normalizationBatchSize: 50,
  providerTimeoutMs: 30_000,
});

const DATA_URL = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export class GradeValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GradeValidationError';
  }
}

export class NormalizationValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NormalizationValidationError';
  }
}

function validateImage(value) {
  if (typeof value !== 'string') throw new GradeValidationError('Images must be data URLs');
  const match = DATA_URL.exec(value);
  if (!match || match[2].length % 4 !== 0) {
    throw new GradeValidationError('Images must be PNG, JPEG, or WebP data URLs');
  }
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.toString('base64') !== match[2]) {
    throw new GradeValidationError('Images must be valid base64 data URLs');
  }
  if (bytes.length > GRADING_LIMITS.maxImageBytes) {
    throw new GradeValidationError('Each image must be at most 2 MiB');
  }
  return { url: value, bytes: bytes.length };
}

export function validateGradeRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new GradeValidationError('Invalid grade request');
  }

  let username;
  try {
    username = validateUsername(body.username);
  } catch {
    throw new GradeValidationError('Invalid username');
  }

  if (!Number.isInteger(body.testNumber) || body.testNumber < 1 || body.testNumber > 4) {
    throw new GradeValidationError('testNumber must be 1..4');
  }
  if (!Number.isInteger(body.maxPoints) || body.maxPoints < 1 || body.maxPoints > GRADING_LIMITS.maxPoints) {
    throw new GradeValidationError('maxPoints must be an integer from 1 to 12');
  }
  if (!Array.isArray(body.images) || body.images.length === 0) {
    throw new GradeValidationError('At least one image is required');
  }
  if (body.images.length > GRADING_LIMITS.maxImages) {
    throw new GradeValidationError('At most four images are allowed');
  }

  const images = body.images.map(validateImage);
  const totalBytes = images.reduce((total, image) => total + image.bytes, 0);
  if (totalBytes > GRADING_LIMITS.maxTotalImageBytes) {
    throw new GradeValidationError('Images may total at most 8 MiB');
  }
  if (body.criteria !== undefined
    && (typeof body.criteria !== 'string' || body.criteria.length > GRADING_LIMITS.maxCriteriaChars)) {
    throw new GradeValidationError('criteria must be at most 2000 characters');
  }

  return {
    username,
    testNumber: body.testNumber,
    maxPoints: body.maxPoints,
    images: images.map(({ url }) => url),
    criteria: (body.criteria || '').trim(),
  };
}

export function validateNormalizationRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new NormalizationValidationError('Invalid normalization request');
  }
  if (!Number.isInteger(body.testNumber) || body.testNumber < 1 || body.testNumber > 4) {
    throw new NormalizationValidationError('testNumber must be 1..4');
  }
  if (!Number.isInteger(body.maxPoints) || body.maxPoints < 1 || body.maxPoints > GRADING_LIMITS.maxPoints) {
    throw new NormalizationValidationError('maxPoints must be an integer from 1 to 12');
  }
  return { testNumber: body.testNumber, maxPoints: body.maxPoints };
}
