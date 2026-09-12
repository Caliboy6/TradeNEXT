import test from 'node:test';
import assert from 'node:assert/strict';
import { readSession, writeSession, clearSession, safeDestination } from '../opennext-session.js';
function memoryStorage() {
  let value = null;
  return { getItem: () => value, setItem: (_key, next) => { value = next; }, removeItem: () => { value = null; } };
}
test('demo access requires a valid, unexpired session and logout revokes it', () => {
  const store = memoryStorage();
  assert.equal(readSession(store), null);
  const session = writeSession(store, { email: 'qa@example.test' });
  assert.equal(readSession(store).email, session.email);
  clearSession(store);
  assert.equal(readSession(store), null);
  store.setItem('', JSON.stringify({ ...session, expiresAt: Date.now() - 1 }));
  assert.equal(readSession(store), null);
  store.setItem('', 'malformed');
  assert.equal(readSession(store), null);
});
test('return destinations stay inside known workspace routes', () => {
  for (const route of ['models','gpus','rfq','supply','data','docs','scheduler']) assert.equal(safeDestination(route),route);
  for (const route of ['https://example.com','//example.com','javascript:alert(1)','home',null]) assert.equal(safeDestination(route),'models');
});
test('disabled browser storage does not break demo entry or signout', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(readSession(blocked), null);
  assert.equal(writeSession(blocked).demo, true);
  assert.doesNotThrow(() => clearSession(blocked));
});
