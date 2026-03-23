import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Failed to delete IndexedDB database.'));
    request.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  await deleteDatabase('rps-arena');
  window.location.hash = '#/';
});

afterEach(() => {
  cleanup();
  window.location.hash = '#/';
});
