import { GRADING_LIMITS } from './limits.js';
import { ModelOutputError, parseGradeOutput } from './schemas.js';

export class GradeProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GradeProviderError';
  }
}

async function requestModel({ messages, model }, {
  fetchImpl = fetch,
  apiKey = process.env.OPENAI_API_KEY,
  timeoutMs = GRADING_LIMITS.providerTimeoutMs,
} = {}) {
  if (!apiKey || !String(apiKey).trim()) throw new GradeProviderError('AI grading unavailable');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || process.env.OPENAI_GRADING_MODEL || 'gpt-4.1',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages,
      }),
    });
    if (!response.ok) throw new GradeProviderError('AI grading unavailable');
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new ModelOutputError('Invalid provider output');
    return content;
  } catch (error) {
    if (error instanceof GradeProviderError || error instanceof ModelOutputError) throw error;
    throw new GradeProviderError('AI grading unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

function gradePrompt({ maxPoints, criteria }) {
  return `You are a careful, fair grader for short-answer and calculation tests. `
    + `Score only semantic correctness; ignore superficial formatting and harmless naming differences. `
    + `Respond only with JSON: {"points": integer 0..${maxPoints}, "reasoning": non-empty concise Czech explanation up to ${GRADING_LIMITS.maxReasoningChars} characters}.`
    + (criteria ? `\nGrading criteria: ${criteria}` : '');
}

export async function gradeImages(input, dependencies = {}) {
  try {
    const raw = await requestModel({
      messages: [{ role: 'user', content: [
        { type: 'text', text: gradePrompt(input) },
        ...input.images.map((url) => ({ type: 'image_url', image_url: { url } })),
      ] }],
      model: dependencies.model,
    }, dependencies);
    return parseGradeOutput(raw, input.maxPoints);
  } catch (error) {
    if (error instanceof ModelOutputError) throw new GradeProviderError(error.message);
    throw error;
  }
}

export { requestModel };
