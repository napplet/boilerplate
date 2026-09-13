import {
  IDENTITY_DOMAIN,
  NOTIFY_DOMAIN,
  OUTBOX_DOMAIN,
  RESOURCE_DOMAIN,
  STORAGE_DOMAIN,
  identity,
  notify,
  outbox,
  resource,
  storage,
  type NostrEvent,
  type Subscription,
} from '@napplet/sdk';
import { runtimeHasDomain } from './domain-availability.js';
import './styles.css';

type StatusKind = 'idle' | 'ok' | 'warn' | 'error';

const elements = {
  status: requireElement<HTMLOutputElement>('#status'),
  capabilities: requireElement<HTMLDListElement>('#capabilities'),
  identityValue: requireElement<HTMLParagraphElement>('#identityValue'),
  noteInput: requireElement<HTMLTextAreaElement>('#noteInput'),
  storageValue: requireElement<HTMLParagraphElement>('#storageValue'),
  output: requireElement<HTMLPreElement>('#output'),
  identityButton: requireElement<HTMLButtonElement>('#identityButton'),
  storageButton: requireElement<HTMLButtonElement>('#storageButton'),
  outboxButton: requireElement<HTMLButtonElement>('#outboxButton'),
  resourceButton: requireElement<HTMLButtonElement>('#resourceButton'),
  notifyButton: requireElement<HTMLButtonElement>('#notifyButton'),
};

let identitySubscription: Subscription | null = null;

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

function setStatus(kind: StatusKind, message: string): void {
  elements.status.className = `status status-${kind}`;
  elements.status.textContent = message;
}

function setOutput(value: unknown): void {
  elements.output.textContent =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function domainStatus(domain: string): 'yes' | 'no' {
  return runtimeHasDomain(domain) ? 'yes' : 'no';
}

function renderCapabilities(): void {
  const rows = [
    ['outbox', domainStatus(OUTBOX_DOMAIN)],
    ['storage', domainStatus(STORAGE_DOMAIN)],
    ['identity', domainStatus(IDENTITY_DOMAIN)],
    ['resource', domainStatus(RESOURCE_DOMAIN)],
    ['notify', domainStatus(NOTIFY_DOMAIN)],
  ];

  elements.capabilities.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      description.dataset.state = value === 'no' ? 'off' : 'on';
      return [term, description];
    }),
  );

  elements.outboxButton.disabled = !runtimeHasDomain(OUTBOX_DOMAIN);
  elements.storageButton.disabled = !runtimeHasDomain(STORAGE_DOMAIN);
  elements.identityButton.disabled = !runtimeHasDomain(IDENTITY_DOMAIN);
  elements.resourceButton.disabled = !runtimeHasDomain(RESOURCE_DOMAIN);
  elements.notifyButton.disabled = !runtimeHasDomain(NOTIFY_DOMAIN);
}

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 5000,
): Promise<T> {
  let timer = 0;
  const timeout = new Promise<T>((_, reject) => {
    timer = window.setTimeout(() => {
      reject(new Error(`${label} did not resolve within ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}

function summarizeEvent(event: NostrEvent): {
  id: string;
  kind: number;
  created_at: number;
  content: string;
} {
  return {
    id: event.id,
    kind: event.kind,
    created_at: event.created_at,
    content: event.content.slice(0, 160),
  };
}

function shortPubkey(pubkey: string): string {
  if (!pubkey) return 'not connected';
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
}

async function refreshIdentity(): Promise<void> {
  setStatus('idle', 'Reading identity');
  const pubkey = await withTimeout(identity.getPublicKey(), 'identity.getPublicKey');
  elements.identityValue.textContent = shortPubkey(pubkey);
  setStatus(pubkey ? 'ok' : 'warn', pubkey ? 'Identity loaded' : 'No user identity');
}

async function saveNote(): Promise<void> {
  setStatus('idle', 'Saving note');
  const value = elements.noteInput.value.trim();
  await withTimeout(storage.setItem('draft-note', value), 'storage.setItem');
  const saved = await withTimeout(storage.getItem('draft-note'), 'storage.getItem');
  elements.storageValue.textContent = saved ?? 'missing';
  setStatus('ok', 'Note saved');
}

async function queryOutbox(): Promise<void> {
  setStatus('idle', 'Querying outbox');
  const limit = 5;
  const result = await withTimeout(
    outbox.query([{ kinds: [1], limit }], { limit, timeoutMs: 8000 }),
    'outbox.query',
    8000,
  );
  if (result.error && result.events.length === 0) throw new Error(result.error);
  setOutput(result.events.map((eventResult) => summarizeEvent(eventResult.event)));
  const message = `Loaded ${result.events.length} event${result.events.length === 1 ? '' : 's'}`;
  const partial = result.incomplete || Boolean(result.error);
  setStatus(
    partial ? 'warn' : 'ok',
    partial ? `${message} (partial${result.error ? `: ${result.error}` : ''})` : message,
  );
}

async function loadResource(): Promise<void> {
  setStatus('idle', 'Loading resource');
  const blob = await withTimeout(
    resource.bytes('data:text/plain;base64,TmFwcGxldCByZXNvdXJjZSBjaGVjaw=='),
    'resource.bytes',
  );
  const text = await blob.text();
  setOutput({ resource: text, bytes: blob.size, type: blob.type || 'unknown' });
  setStatus('ok', 'Resource loaded');
}

async function sendNotification(): Promise<void> {
  setStatus('idle', 'Sending notification');
  const result = await withTimeout(
    notify.send({
      title: 'Napplet ready',
      body: 'The starter app can talk to the shell notification surface.',
      priority: 'normal',
    }),
    'notify.send',
  );
  setOutput(result);
  setStatus('ok', 'Notification sent');
}

function subscribeToIdentityChanges(): void {
  if (!runtimeHasDomain(IDENTITY_DOMAIN)) return;
  try {
    identitySubscription = identity.onChanged((pubkey) => {
      elements.identityValue.textContent = shortPubkey(pubkey);
      setStatus(pubkey ? 'ok' : 'warn', pubkey ? 'Identity changed' : 'Identity cleared');
    });
  } catch (error) {
    setOutput(error instanceof Error ? error.message : error);
  }
}

function handleAction(action: () => Promise<void>): void {
  action().catch((error: unknown) => {
    setStatus('error', 'Action failed');
    setOutput(error instanceof Error ? error.message : error);
  });
}

function handleOptionalAction(
  domain: string,
  label: string,
  action: () => Promise<void>,
): void {
  if (!runtimeHasDomain(domain)) {
    setStatus('warn', `${label} unavailable in this runtime`);
    return;
  }
  handleAction(action);
}

elements.identityButton.addEventListener('click', () => {
  handleOptionalAction(IDENTITY_DOMAIN, 'Identity', refreshIdentity);
});
elements.storageButton.addEventListener('click', () => {
  handleOptionalAction(STORAGE_DOMAIN, 'Storage', saveNote);
});
elements.outboxButton.addEventListener('click', () => {
  handleOptionalAction(OUTBOX_DOMAIN, 'Outbox', queryOutbox);
});
elements.resourceButton.addEventListener('click', () => {
  handleOptionalAction(RESOURCE_DOMAIN, 'Resource loading', loadResource);
});
elements.notifyButton.addEventListener('click', () => {
  handleOptionalAction(NOTIFY_DOMAIN, 'Notifications', sendNotification);
});

window.addEventListener('beforeunload', () => {
  identitySubscription?.close();
});

renderCapabilities();
subscribeToIdentityChanges();
setOutput('Napplet ready. Unavailable optional-domain actions are disabled.');
