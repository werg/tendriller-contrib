// Typecheck from the installed public SDK, alongside the actual-host gate.
import type { RuntimeApi } from '@tendriller/core/contract';
import { createSignalBinding, SignalError, type EphemeralSignal, type SignalBinding,
  type SignalPayload, type Signals } from '@tendriller/core/signals';

declare const runtime: RuntimeApi;
declare const service: Signals;
const payload: SignalPayload = { typing: true };
const binding: SignalBinding = createSignalBinding();
binding.install(service);
runtime.signals.install(service);
const installed: boolean = runtime.signals.available;
const ready: Promise<Signals> = runtime.signals.ready();
const sent: Promise<EphemeralSignal> = runtime.signals.send('typing', payload, { ttlMs: 2500 });
const observed: AsyncIterable<EphemeralSignal> = runtime.signals.subscribe({ topics: ['typing'], mode: 'latest' });
const error: Error & { readonly code: string } = new SignalError('surface-check', 'Public signal error');
void [installed, ready, sent, observed, error];
