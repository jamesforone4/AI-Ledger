
export interface LedgerEntry {
  id: string;
  date: string;
  item: string;
  amount: number;
  category: string;
  timestamp: number;
  sourceText?: string; // 原始輸入文字
}

export interface ExtractionResult {
  date: string;
  item: string;
  amount: number;
  category: string;
}

export enum SyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
