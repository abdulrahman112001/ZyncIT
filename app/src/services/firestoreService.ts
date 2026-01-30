/**
 * Generic Firebase Service
 *
 * Type-safe Firebase Firestore operations with generics
 */

import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {
  BaseEntity,
  SyncableEntity,
  Result,
  PaginationMeta,
} from '../types/generics';

// ============================================
// Types
// ============================================

export type QueryOperator =
  | '<'
  | '<='
  | '=='
  | '>='
  | '>'
  | 'array-contains'
  | 'in'
  | 'array-contains-any';

export interface QueryFilter<T> {
  field: keyof T & string;
  operator: QueryOperator;
  value: unknown;
}

export interface QueryOptions<T> {
  filters?: QueryFilter<T>[];
  orderBy?: { field: keyof T & string; direction?: 'asc' | 'desc' };
  limit?: number;
  startAfter?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: FirebaseFirestoreTypes.DocumentSnapshot | null;
  hasMore: boolean;
}

// ============================================
// Generic Firestore Service
// ============================================

export class FirestoreService<T extends BaseEntity> {
  private collectionPath: string;

  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  // Get collection reference
  private get collection(): FirebaseFirestoreTypes.CollectionReference {
    return firestore().collection(this.collectionPath);
  }

  // Get document reference
  private docRef(id: string): FirebaseFirestoreTypes.DocumentReference {
    return this.collection.doc(id);
  }

  // Apply query options
  private applyQueryOptions(
    query: FirebaseFirestoreTypes.Query,
    options?: QueryOptions<T>,
  ): FirebaseFirestoreTypes.Query {
    if (!options) return query;

    let q = query;

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        q = q.where(filter.field, filter.operator, filter.value);
      }
    }

    // Apply ordering
    if (options.orderBy) {
      q = q.orderBy(options.orderBy.field, options.orderBy.direction || 'desc');
    }

    // Apply pagination
    if (options.startAfter) {
      q = q.startAfter(options.startAfter);
    }

    if (options.limit) {
      q = q.limit(options.limit);
    }

    return q;
  }

  // ============================================
  // CRUD Operations
  // ============================================

  /**
   * Get document by ID
   */
  async getById(id: string): Promise<Result<T>> {
    try {
      const doc = await this.docRef(id).get();
      if (!doc.exists) {
        return { success: false, error: new Error('Document not found') };
      }
      return { success: true, data: { id: doc.id, ...doc.data() } as T };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Get all documents with optional query
   */
  async getAll(options?: QueryOptions<T>): Promise<Result<T[]>> {
    try {
      const query = this.applyQueryOptions(this.collection, options);
      const snapshot = await query.get();
      const items = snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as T),
      );
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Get paginated documents
   */
  async getPaginated(
    pageSize: number = 20,
    lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot,
    options?: Omit<QueryOptions<T>, 'limit' | 'startAfter'>,
  ): Promise<Result<PaginatedResult<T>>> {
    try {
      let query = this.applyQueryOptions(this.collection, options);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      query = query.limit(pageSize);

      const snapshot = await query.get();
      const items = snapshot.docs.map(
        doc => ({ id: doc.id, ...doc.data() } as T),
      );

      return {
        success: true,
        data: {
          items,
          lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
          hasMore: snapshot.docs.length === pageSize,
        },
      };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Create new document
   */
  async create(data: Omit<T, 'id'>, customId?: string): Promise<Result<T>> {
    try {
      const docData = {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      let docRef: FirebaseFirestoreTypes.DocumentReference;

      if (customId) {
        docRef = this.docRef(customId);
        await docRef.set(docData);
      } else {
        docRef = await this.collection.add(docData);
      }

      return { success: true, data: { id: docRef.id, ...docData } as T };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Update document
   */
  async update(id: string, data: Partial<T>): Promise<Result<void>> {
    try {
      await this.docRef(id).update({
        ...data,
        updatedAt: Date.now(),
      });
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Set document (create or replace)
   */
  async set(id: string, data: Omit<T, 'id'>, merge = true): Promise<Result<T>> {
    try {
      const docData = {
        ...data,
        updatedAt: Date.now(),
      };

      await this.docRef(id).set(docData, { merge });
      return { success: true, data: { id, ...docData } as T };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<Result<void>> {
    try {
      await this.docRef(id).delete();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Batch create documents
   */
  async batchCreate(
    items: Array<Omit<T, 'id'> & { id?: string }>,
  ): Promise<Result<T[]>> {
    try {
      const batch = firestore().batch();
      const timestamp = Date.now();
      const createdItems: T[] = [];

      for (const item of items) {
        const id = item.id || this.collection.doc().id;
        const docRef = this.docRef(id);
        const docData = {
          ...item,
          id: undefined, // Remove id from data
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        delete docData.id;
        batch.set(docRef, docData);
        createdItems.push({ id, ...docData } as T);
      }

      await batch.commit();
      return { success: true, data: createdItems };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Batch update documents
   */
  async batchUpdate(
    updates: Array<{ id: string; data: Partial<T> }>,
  ): Promise<Result<void>> {
    try {
      const batch = firestore().batch();
      const timestamp = Date.now();

      for (const { id, data } of updates) {
        const docRef = this.docRef(id);
        batch.update(docRef, { ...data, updatedAt: timestamp });
      }

      await batch.commit();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Batch delete documents
   */
  async batchDelete(ids: string[]): Promise<Result<void>> {
    try {
      const batch = firestore().batch();

      for (const id of ids) {
        batch.delete(this.docRef(id));
      }

      await batch.commit();
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  // ============================================
  // Real-time Listeners
  // ============================================

  /**
   * Subscribe to document changes
   */
  subscribeToDoc(
    id: string,
    onData: (data: T | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return this.docRef(id).onSnapshot(
      doc => {
        if (doc.exists) {
          onData({ id: doc.id, ...doc.data() } as T);
        } else {
          onData(null);
        }
      },
      error => onError?.(error),
    );
  }

  /**
   * Subscribe to collection changes
   */
  subscribeToCollection(
    onData: (data: T[]) => void,
    options?: QueryOptions<T>,
    onError?: (error: Error) => void,
  ): () => void {
    const query = this.applyQueryOptions(this.collection, options);

    return query.onSnapshot(
      snapshot => {
        const items = snapshot.docs.map(
          doc => ({ id: doc.id, ...doc.data() } as T),
        );
        onData(items);
      },
      error => onError?.(error),
    );
  }

  // ============================================
  // Query Helpers
  // ============================================

  /**
   * Find one document matching criteria
   */
  async findOne(filters: QueryFilter<T>[]): Promise<Result<T | null>> {
    try {
      const result = await this.getAll({ filters, limit: 1 });
      if (!result.success) return result as Result<null>;
      return { success: true, data: result.data[0] || null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.docRef(id).get();
    return doc.exists;
  }

  /**
   * Count documents (requires index for filtered queries)
   */
  async count(filters?: QueryFilter<T>[]): Promise<Result<number>> {
    try {
      const result = await this.getAll({ filters });
      if (!result.success) return { success: false, error: result.error };
      return { success: true, data: result.data.length };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create a typed Firestore service for a collection
 */
export function createFirestoreService<T extends BaseEntity>(
  collectionPath: string,
): FirestoreService<T> {
  return new FirestoreService<T>(collectionPath);
}

// ============================================
// Nested Collection Helper
// ============================================

/**
 * Create path for nested collection
 */
export function nestedCollectionPath(
  parentCollection: string,
  parentId: string,
  childCollection: string,
): string {
  return `${parentCollection}/${parentId}/${childCollection}`;
}

/**
 * Create service for user-specific collection
 */
export function createUserCollectionService<T extends BaseEntity>(
  userId: string,
  collectionName: string,
): FirestoreService<T> {
  return new FirestoreService<T>(`users/${userId}/${collectionName}`);
}

/**
 * Create service for device-specific collection
 */
export function createDeviceCollectionService<T extends BaseEntity>(
  userId: string,
  deviceId: string,
  collectionName: string,
): FirestoreService<T> {
  return new FirestoreService<T>(
    `users/${userId}/devices/${deviceId}/${collectionName}`,
  );
}
