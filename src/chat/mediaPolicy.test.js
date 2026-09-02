import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatBytes,
  formatDuration,
  validateFile,
} from './mediaPolicy.js'

function fileFor(name, type, sizeBytes) {
  const content = new Uint8Array(Math.min(sizeBytes, 1024))
  // 超大文件只模拟声明大小：validateFile 只读 size 字段，不读内容
  return { name, type, size: sizeBytes, content }
}

test('image validation accepts supported types within the size limit', () => {
  assert.equal(validateFile('image', fileFor('photo.png', 'image/png', 300 * 1024)), '')
  assert.equal(validateFile('image', fileFor('photo.JPG', 'image/jpeg', 5 * 1024 * 1024)), '')
})

test('image validation rejects oversized files and unsupported types', () => {
  assert.match(validateFile('image', fileFor('big.png', 'image/png', 11 * 1024 * 1024)), /超过大小限制/)
  assert.match(validateFile('image', fileFor('page.html', 'text/html', 1024)), /不支持的图片格式/)
})

test('file validation enforces the whitelist and the 50 MB cap', () => {
  assert.equal(validateFile('file', fileFor('合同.pdf', 'application/pdf', 1024)), '')
  assert.match(validateFile('file', fileFor('脚本.exe', 'application/x-msdownload', 1024)), /不支持的文件格式/)
  assert.match(validateFile('file', fileFor('huge.zip', 'application/zip', 51 * 1024 * 1024)), /超过大小限制/)
})

test('duration helpers format voice durations', () => {
  assert.equal(formatDuration(52_000), '00:52')
  assert.equal(formatDuration(5 * 60 * 1000), '05:00')
  assert.equal(formatBytes(2 * 1024 * 1024), '2.0 MB')
})
