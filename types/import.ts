import { Transaction } from './transaction';

/**
 * Supported file formats for importing financial data
 */
export type ImportFileFormat = 'csv' | 'ofx' | 'qfx';

/**
 * Common interface for import data regardless of source format
 */
export interface ImportData {
  preview: any[];
  headers: string[];
  format: ImportFileFormat;
}

/**
 * Statistics about an import operation
 */
export interface ImportStats {
  added: number;
  updated: number;
  duplicates: number;
  errors: number;
}

/**
 * Source of imported data
 */
export type ImportSource = 'file' | 'bank';

/**
 * Column mapping configuration for CSV imports
 */
export interface ColumnMapping {
  [csvHeader: string]: string; // Maps CSV header to app field
}

/**
 * OFX/QFX specific data structures
 */

/**
 * OFX Financial Institution data
 */
export interface OFXFinancialInstitution {
  name: string;
  id: string;
  org: string;
  fid: string;
}

/**
 * OFX Account Information
 */
export interface OFXAccount {
  accountId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDITCARD' | 'INVESTMENT' | string;
  accountNumber?: string;
  bankId?: string;
  currency?: string;
}

/**
 * OFX Balance Information
 */
export interface OFXBalance {
  amount: number;
  date: Date;
  type: 'ledger' | 'available';
}

/**
 * OFX Transaction
 */
export interface OFXTransaction {
  id: string; // FITID in OFX
  date: Date; // DTPOSTED
  amount: number;
  name?: string; // NAME
  memo?: string; // MEMO
  payee?: string; // PAYEE
  checkNumber?: string; // CHECKNUM
  refNumber?: string; // REFNUM
  type?: string; // TRNTYPE
  sic?: string; // Standard Industrial Classification code
}

/**
 * OFX Statement
 */
export interface OFXStatement {
  currency: string;
  bankId?: string;
  accountId: string;
  accountType: string;
  startDate: Date;
  endDate: Date;
  ledgerBalance?: OFXBalance;
  availableBalance?: OFXBalance;
  transactions: OFXTransaction[];
}

/**
 * Complete OFX document structure
 */
export interface OFXDocument {
  version: string;
  signOnMsg?: {
    statusCode: string;
    statusSeverity: string;
    statusMessage?: string;
    dtServer: Date;
    language: string;
    dtProfUp?: Date;
    dtAcctUp?: Date;
    fi?: OFXFinancialInstitution;
  };
  bankMsgRs?: {
    statements: OFXStatement[];
  };
  creditCardMsgRs?: {
    statements: OFXStatement[];
  };
}

/**
 * Result of parsing an OFX/QFX file
 */
export interface OFXParseResult {
  document: OFXDocument;
  statements: OFXStatement[];
  transactions: OFXTransaction[];
  error?: string;
}

/**
 * Mapping between OFX transaction fields and app transaction fields
 */
export interface OFXFieldMapping {
  date: keyof OFXTransaction;
  amount: keyof OFXTransaction;
  payee: keyof OFXTransaction;
  description: keyof OFXTransaction;
  checkNumber: keyof OFXTransaction;
  refNumber: keyof OFXTransaction;
}

/**
 * Result of transaction matching process
 */
export interface TransactionMatchResult {
  duplicates: Transaction[];
  unique: Transaction[];
  updated: Transaction[];
}