import { strict as assert } from 'node:assert'
import { resolveInput } from '../src/main/window-manager/tab-manager'

// Minimal zero-dependency test runner: `node --import tsx tests/resolve-input.test.ts`
// (or wire into vitest later). Tests the address-bar URL/search heuristic.

assert.equal(resolveInput('https://example.com'), 'https://example.com')
assert.equal(resolveInput('example.com'), 'https://example.com')
assert.equal(resolveInput('example.com/path'), 'https://example.com/path')
assert.equal(
  resolveInput('how do microservices talk'),
  'https://duckduckgo.com/?q=how%20do%20microservices%20talk'
)
assert.equal(resolveInput('  '), 'https://duckduckgo.com')

console.log('resolve-input: all assertions passed')
