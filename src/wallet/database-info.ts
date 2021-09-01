import * as idb from 'idb';

// This is just until indexedDb.getDatabases() is fully supported

export async function list(): Promise<string[]> {
  const db = await open();

  const names = await db.getAll('names');

  return names.map((n) => n.name);
}

export async function add(name: string) {
  const db = await open();
  return db.put('names', { name });
}

export async function remove(name: string) {
  const db = await open();
  return db.delete('names', name);
}

async function open() {
  return idb.openDB<DbNamesSchema>('dbnames', 1, {
    upgrade(db) {
      db.createObjectStore('names', { keyPath: 'name' });
    },
  });
}


// does this catch properly?
export async function tryIDB() { 
  try {
    await idb.openDB<DbNamesSchema>('dbnames', 1)
  }
  catch (err) {
    return false
  }
}

interface DbInfo {
  name: string;
}

interface DbNamesSchema extends idb.DBSchema {
  names: {
    key: string;
    value: DbInfo;
  };
}
