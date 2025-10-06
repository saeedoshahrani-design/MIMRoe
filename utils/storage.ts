// utils/storage.ts
const APP_PREFIX = 'mimr-oe';
const SCHEMA_VERSION = 1;

type Box<T> = { version: number; data: T };

function key(name: string) {
  return `${APP_PREFIX}:${name}`;
}

export function loadBox<T>(name: string, fallback: T): T {
  const k = key(name);
  const raw = localStorage.getItem(k);
  if (!raw) {
    // Seeding for the first time only
    saveBox(name, fallback);
    console.info(`[storage] Seeded initial data for '${name}'`);
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Box<T>;
    if (parsed.version !== SCHEMA_VERSION) {
      console.warn(`[storage] Data version mismatch for '${name}'. Found v${parsed.version}, expected v${SCHEMA_VERSION}. Data will be used as is. Implement migration logic here for future schema changes.`);
      const migrated = parsed.data; // Placeholder for future migration logic
      saveBox(name, migrated);
      return migrated;
    }
    return parsed.data;
  } catch(e) {
    console.error(`[storage] Failed to parse data for '${name}'. Resetting to fallback data.`, e);
    saveBox(name, fallback);
    return fallback;
  }
}

export function saveBox<T>(name: string, data: T) {
  const k = key(name);
  const boxed: Box<T> = { version: SCHEMA_VERSION, data };
  try {
    localStorage.setItem(k, JSON.stringify(boxed));
  } catch (error) {
    console.error(`[storage] Failed to save data for '${name}'.`, error);
  }
}
