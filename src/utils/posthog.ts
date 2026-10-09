// PostHog is loaded by the inline snippet in src/layouts/scripts/posthog.astro (absent when its env vars are not set).

type Properties = Record<string, unknown>;
type LogFn = (message: string, attributes?: Properties) => void;

interface PostHogClient {
  capture(event: string, properties?: Properties): void;
  identify(distinctId: string, properties?: Properties): void;
  logger?: { info: LogFn; warn: LogFn; error: LogFn };
}

/** Read on each call: the loader stub in window.posthog is replaced once the library loads. */
export const posthog = () => (window as typeof window & { posthog?: PostHogClient }).posthog;

/** Conversion events, as named in PostHog. */
export const events = {
  quoteRequest: "quote_request_submitted",
  whatsapp: "whatsapp_contact_started",
  phone: "phone_contact_started",
} as const;
