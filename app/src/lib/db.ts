import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { CardProgress } from '../types'

interface OogwayDB extends DBSchema {
  progress: {
    key: [string, string] // [userId, cardId]
    value: CardProgress
    indexes: {
      'by-user-deck': [string, string]
      'by-due': string
    }
  }
  settings: {
    key: string
    value: unknown
  }
}

let dbPromise: Promise<IDBPDatabase<OogwayDB>> | null = null

export function getDB(): Promise<IDBPDatabase<OogwayDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OogwayDB>('energy-oogway', 1, {
      upgrade(db) {
        const progress = db.createObjectStore('progress', {
          keyPath: ['userId', 'cardId'],
        })
        progress.createIndex('by-user-deck', ['userId', 'deckId'])
        progress.createIndex('by-due', 'dueDate')
        db.createObjectStore('settings')
      },
    })
  }
  return dbPromise
}
