/**
 * ZyncIT Chrome Extension - Performance Utilities
 */

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeoutId = null

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, wait) {
  let lastTime = 0

  return (...args) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * Deduplicate array by id
 */
export function deduplicateById(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}

/**
 * Simple LRU Cache
 */
export class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key) {
    if (!this.cache.has(key)) {
      return undefined
    }
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
    this.cache.set(key, value)
  }

  has(key) {
    return this.cache.has(key)
  }

  clear() {
    this.cache.clear()
  }
}

/**
 * Batch processor for Firebase operations
 */
export class BatchProcessor {
  constructor(processor, options = {}) {
    this.items = []
    this.timeoutId = null
    this.processor = processor
    this.batchSize = options.batchSize || 50
    this.delay = options.delay || 500
  }

  add(item) {
    this.items.push(item)

    if (this.items.length >= this.batchSize) {
      this.flush()
      return
    }

    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flush()
      }, this.delay)
    }
  }

  async flush() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.items.length === 0) return

    const itemsToProcess = [...this.items]
    this.items = []

    try {
      await this.processor(itemsToProcess)
    } catch (error) {
      console.error("Batch processing error:", error)
    }
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.items = []
  }
}
