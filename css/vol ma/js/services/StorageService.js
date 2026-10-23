/**
 * Service: StorageService
 * 
 * OOP CONCEPT: Data-Access Abstraction Layer (Repository Pattern)
 * Decouples the business logic from the underlying storage mechanism (localStorage).
 * Can be swapped for an HTTP / REST API Client without altering business models.
 */
// In-memory fallback if localStorage is unavailable
const memoryStore = new Map();

const storageBackend = {
  getItem(key) {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStore.get(key) || null;
  },
  setItem(key, value) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memoryStore.set(key, String(value));
    }
  },
  removeItem(key) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      memoryStore.delete(key);
    }
  }
};

export class StorageService {
  #prefix;

  constructor(prefix = 'vms_') {
    this.#prefix = prefix;
  }

  /**
   * Helper to get full key
   */
  #getKey(collection) {
    return `${this.#prefix}${collection}`;
  }

  /**
   * Get all items from a collection
   * @param {string} collection
   * @returns {Array}
   */
  getAll(collection) {
    try {
      const data = storageBackend.getItem(this.#getKey(collection));
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error(`Failed to read collection "${collection}":`, err);
      return [];
    }
  }

  /**
   * Get single item by ID
   * @param {string} collection
   * @param {string} id
   * @returns {Object|null}
   */
  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  /**
   * Save a single item (create)
   * @param {string} collection
   * @param {Object} item
   * @returns {Object}
   */
  save(collection, item) {
    const items = this.getAll(collection);
    items.push(item);
    this.#write(collection, items);
    return item;
  }

  /**
   * Update an existing item by ID
   * @param {string} collection
   * @param {string} id
   * @param {Object} updatedFields
   * @returns {Object|null}
   */
  update(collection, id, updatedFields) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...updatedFields, id };
    this.#write(collection, items);
    return items[index];
  }

  /**
   * Delete an item by ID
   * @param {string} collection
   * @param {string} id
   * @returns {boolean}
   */
  delete(collection, id) {
    const items = this.getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length !== items.length) {
      this.#write(collection, filtered);
      return true;
    }
    return false;
  }

  /**
   * Bulk save / replace entire collection
   * @param {string} collection
   * @param {Array} items
   */
  setAll(collection, items) {
    this.#write(collection, items);
  }

  /**
   * Clear an entire collection
   * @param {string} collection
   */
  clear(collection) {
    storageBackend.removeItem(this.#getKey(collection));
  }

  /**
   * Clear all app storage
   */
  clearAll() {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.#prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } else {
      memoryStore.clear();
    }
  }

  #write(collection, data) {
    try {
      storageBackend.setItem(this.#getKey(collection), JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to write for "${collection}":`, err);
      throw new Error('Local storage quota exceeded or storage unavailable.');
    }
  }
}

export const storage = new StorageService();
