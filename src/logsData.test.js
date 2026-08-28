import test from 'node:test'
import assert from 'node:assert/strict'
import { countByLevel, filterLogs, operationLogs, serviceLogs, systemLogs } from './logsData.js'

test('three observability log datasets share a uniform row shape', () => {
  for (const logs of [systemLogs, operationLogs, serviceLogs]) {
    assert.ok(logs.length >= 8)
    for (const row of logs) {
      assert.match(row.id, /^(LOG|OP|SL)-\d+$/)
      assert.equal(typeof row.time, 'string')
      assert.ok(['info', 'warning', 'error'].includes(row.level))
      assert.equal(typeof row.scope, 'string')
      assert.equal(typeof row.event, 'string')
      assert.equal(typeof row.actor, 'string')
      assert.equal(typeof row.traceId, 'string')
      assert.equal(typeof row.detail, 'string')
    }
  }
})

test('filtering matches keyword across fields and respects the level filter', () => {
  const byTrace = filterLogs(systemLogs, 'trc-59af18')
  assert.equal(byTrace.length, 1)
  assert.equal(byTrace[0].scope, '配额中心')
  const warningsOnly = filterLogs(systemLogs, '', 'warning')
  assert.ok(warningsOnly.length > 0)
  assert.ok(warningsOnly.every((row) => row.level === 'warning'))
  const combined = filterLogs(systemLogs, 'webhook', 'error')
  assert.equal(combined.length, 1)
  assert.equal(combined[0].id, 'LOG-90198')
})

test('level counters add up to the dataset size', () => {
  const counts = countByLevel(serviceLogs)
  assert.equal(counts.info + counts.warning + counts.error, serviceLogs.length)
})
