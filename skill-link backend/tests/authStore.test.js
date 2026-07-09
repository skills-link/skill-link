const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createUser, getUserByEmail, getUserById, resetStore } = require('../config/authStore');

test('createUser and lookup work for new accounts', () => {
  const tempPath = path.join(__dirname, 'tmp-auth-store.json');
  resetStore(tempPath);

  const created = createUser({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'job_seeker',
    status: 'active',
    storePath: tempPath
  });

  assert.equal(created.email, 'test@example.com');
  assert.equal(getUserByEmail('test@example.com', tempPath)?.id, created.id);
  assert.equal(getUserById(created.id, tempPath)?.name, 'Test User');

  fs.unlinkSync(tempPath);
});
