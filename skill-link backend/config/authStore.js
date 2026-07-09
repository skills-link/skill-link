const fs = require('node:fs');
const path = require('node:path');

const defaultStorePath = path.join(__dirname, '..', 'data', 'auth-store.json');

const ensureStore = (storePath = defaultStorePath) => {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify({ users: [] }, null, 2));
  }

  return storePath;
};

const readStore = (storePath = defaultStorePath) => {
  ensureStore(storePath);
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
};

const writeStore = (store, storePath = defaultStorePath) => {
  ensureStore(storePath);
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
};

const resetStore = (storePath = defaultStorePath) => {
  writeStore({ users: [] }, storePath);
  return { users: [] };
};

const createUser = ({ name, email, passwordHash, role, status = 'active', storePath = defaultStorePath }) => {
  const store = readStore(storePath);
  const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return null;
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password: passwordHash,
    role,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.users.push(user);
  writeStore(store, storePath);
  return user;
};

const getUserByEmail = (email, storePath = defaultStorePath) => {
  const store = readStore(storePath);
  return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

const getUserById = (id, storePath = defaultStorePath) => {
  const store = readStore(storePath);
  return store.users.find((u) => u.id === id) || null;
};

module.exports = { createUser, getUserByEmail, getUserById, resetStore };
