import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType } from '@/types/transaction';
import {
  OFXDocument,
  OFXParseResult,
  OFXTransaction,
  OFXStatement,
  OFXFieldMapping,
  TransactionMatchResult,
  ImportData
} from '@/types/import';
import { readFileAsString } from './csvUtils';

/**
 * Detects if a file is an OFX/QFX file based on its content
 * @param content The file content as a string
 * @returns True if the content appears to be OFX/QFX format
 */
export const isOFXFile = (content: string): boolean => {
  // Check for OFX header
  return content.includes('OFXHEADER:') || 
         content.includes('<OFX>') || 
         content.includes('<?OFX ');
};

/**
 * Detects the OFX version from the file content
 * @param content The file content as a string
 * @returns The OFX version (1 or 2)
 */
export const detectOFXVersion = (content: string): number => {
  if (content.includes('<?OFX ') || content.includes('<OFX>')) {
    return 2; // XML format (OFX 2.x)
  }
  return 1; // SGML format (OFX 1.x)
};

/**
 * Parses an OFX/QFX file and returns the structured data
 * @param fileUri The URI of the OFX/QFX file
 * @returns A promise resolving to the parsed OFX data
 */
export const parseOFXFile = async (fileUri: string): Promise<OFXParseResult> => {
  try {
    console.log('[DEBUG] OFX Import: Starting OFX file parsing', { fileUri });
    console.log('[DEBUG] OFX Import: Platform is', Platform.OS);
    
    // Read file content using cross-platform utility
    let content: string;
    try {
      console.log('[DEBUG] OFX Import: About to read file content');
      content = await readFileAsString(fileUri);
      console.log('[DEBUG] OFX Import: File content read successfully', { contentLength: content.length });
    } catch (readError) {
      console.error('[DEBUG] OFX Import: Error reading file content', readError);
      throw readError;
    }
    
    // Detect OFX version
    const version = detectOFXVersion(content);
    console.log('[DEBUG] OFX Import: Detected OFX version', { version });
    
    // Parse based on version
    if (version === 2) {
      console.log('[DEBUG] OFX Import: Parsing as OFX 2.x (XML format)');
      return parseOFX2(content);
    } else {
      console.log('[DEBUG] OFX Import: Parsing as OFX 1.x (SGML format)');
      return parseOFX1(content);
    }
  } catch (error) {
    console.error('OFX parse error:', error);
    return {
      document: { version: 'unknown' },
      statements: [],
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error parsing OFX file'
    };
  }
};

/**
 * Parses OFX 1.x (SGML format) content
 * @param content The OFX file content as a string
 * @returns The parsed OFX data
 */
const parseOFX1 = (content: string): OFXParseResult => {
  try {
    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Extract header information
    const headerMatch = normalizedContent.match(/OFXHEADER:(\d+)[\s\S]*?VERSION:(\d+)[\s\S]*?SECURITY:[\s\S]*?ENCODING:[\s\S]*?CHARSET:[\s\S]*?COMPRESSION:[\s\S]*?OLDFILEUID:[\s\S]*?NEWFILEUID:/);
    const version = headerMatch ? headerMatch[2] : '1';
    
    // Find the start of the actual OFX content (after the headers)
    const ofxContentStart = normalizedContent.indexOf('<OFX>');
    if (ofxContentStart === -1) {
      throw new Error('Invalid OFX format: Missing <OFX> tag');
    }
    
    const ofxContent = normalizedContent.substring(ofxContentStart);
    
    // Parse the SGML content by converting it to a more manageable structure
    const parsedData = parseSGML(ofxContent);
    
    // Extract statements and transactions
    const statements: OFXStatement[] = extractStatements(parsedData);
    
    // Flatten transactions from all statements
    const transactions: OFXTransaction[] = statements.flatMap(stmt => stmt.transactions);
    
    return {
      document: {
        version: `1.${version}`,
        signOnMsg: extractSignOnMsg(parsedData),
        bankMsgRs: statements.some(s => ['CHECKING', 'SAVINGS'].includes(s.accountType)) 
          ? { statements: statements.filter(s => ['CHECKING', 'SAVINGS'].includes(s.accountType)) } 
          : undefined,
        creditCardMsgRs: statements.some(s => s.accountType === 'CREDITCARD') 
          ? { statements: statements.filter(s => s.accountType === 'CREDITCARD') } 
          : undefined
      },
      statements,
      transactions
    };
  } catch (error) {
    console.error('OFX 1.x parse error:', error);
    return {
      document: { version: '1.x' },
      statements: [],
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error parsing OFX 1.x file'
    };
  }
};

/**
 * Parses OFX 2.x (XML format) content
 * @param content The OFX file content as a string
 * @returns The parsed OFX data
 */
const parseOFX2 = (content: string): OFXParseResult => {
  try {
    // For OFX 2.x, we need to parse XML
    // First, clean up the XML to ensure it's valid
    const cleanedXml = cleanOFXXml(content);
    
    // Use a simple XML parser approach since we can't use the DOM API directly in React Native
    const parsedData = parseXML(cleanedXml);
    
    // Extract statements and transactions
    const statements: OFXStatement[] = extractStatementsXML(parsedData);
    
    // Flatten transactions from all statements
    const transactions: OFXTransaction[] = statements.flatMap(stmt => stmt.transactions);
    
    return {
      document: {
        version: '2.0',
        signOnMsg: extractSignOnMsgXML(parsedData),
        bankMsgRs: statements.some(s => ['CHECKING', 'SAVINGS'].includes(s.accountType)) 
          ? { statements: statements.filter(s => ['CHECKING', 'SAVINGS'].includes(s.accountType)) } 
          : undefined,
        creditCardMsgRs: statements.some(s => s.accountType === 'CREDITCARD') 
          ? { statements: statements.filter(s => s.accountType === 'CREDITCARD') } 
          : undefined
      },
      statements,
      transactions
    };
  } catch (error) {
    console.error('OFX 2.x parse error:', error);
    return {
      document: { version: '2.x' },
      statements: [],
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error parsing OFX 2.x file'
    };
  }
};

/**
 * Cleans OFX XML to ensure it's valid for parsing
 * @param xml The raw XML content
 * @returns Cleaned XML content
 */
const cleanOFXXml = (xml: string): string => {
  // Remove XML declaration if present
  let cleaned = xml.replace(/<\?xml.*?\?>/i, '');
  
  // Remove OFX declaration if present
  cleaned = cleaned.replace(/<\?OFX.*?\?>/i, '');
  
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove empty lines
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, '');
  
  return cleaned;
};

/**
 * Simple XML parser for OFX 2.x format
 * @param xml The XML content to parse
 * @returns Parsed XML structure
 */
const parseXML = (xml: string): any => {
  // This is a simplified XML parser for OFX
  // In a production app, you might want to use a proper XML parser library
  
  // For now, we'll implement a basic parser that extracts the key information we need
  const result: any = {};
  
  // Extract OFX root element
  const ofxMatch = xml.match(/<OFX>([\s\S]*)<\/OFX>/i);
  if (!ofxMatch) {
    throw new Error('Invalid OFX XML: Missing OFX root element');
  }
  
  const ofxContent = ofxMatch[1];
  
  // Extract SIGNONMSGSRSV1
  const signOnMatch = ofxContent.match(/<SIGNONMSGSRSV1>([\s\S]*?)<\/SIGNONMSGSRSV1>/i);
  if (signOnMatch) {
    result.SIGNONMSGSRSV1 = parseXMLElement(signOnMatch[1]);
  }
  
  // Extract BANKMSGSRSV1
  const bankMatch = ofxContent.match(/<BANKMSGSRSV1>([\s\S]*?)<\/BANKMSGSRSV1>/i);
  if (bankMatch) {
    result.BANKMSGSRSV1 = parseXMLElement(bankMatch[1]);
  }
  
  // Extract CREDITCARDMSGSRSV1
  const ccMatch = ofxContent.match(/<CREDITCARDMSGSRSV1>([\s\S]*?)<\/CREDITCARDMSGSRSV1>/i);
  if (ccMatch) {
    result.CREDITCARDMSGSRSV1 = parseXMLElement(ccMatch[1]);
  }
  
  return result;
};

/**
 * Parse an XML element and its children
 * @param content The XML element content
 * @returns Parsed element structure
 */
const parseXMLElement = (content: string): any => {
  const result: any = {};
  
  // Find all XML elements at this level
  const elementRegex = /<([A-Z0-9_]+)>([\s\S]*?)<\/\1>|<([A-Z0-9_]+)>([^<]*)/gi;
  let match;
  
  while ((match = elementRegex.exec(content)) !== null) {
    const tagName = match[1] || match[3];
    const tagContent = match[2] || match[4] || '';
    
    // Check if content has child elements
    if (/<[A-Z0-9_]+>/i.test(tagContent)) {
      result[tagName] = parseXMLElement(tagContent);
    } else {
      // It's a leaf node with just text content
      result[tagName] = tagContent.trim();
    }
  }
  
  return result;
};

/**
 * Parse SGML format OFX 1.x content
 * @param sgml The SGML content to parse
 * @returns Parsed SGML structure
 */
const parseSGML = (sgml: string): any => {
  const result: any = {};
  
  // Extract OFX root element
  const ofxMatch = sgml.match(/<OFX>([\s\S]*)<\/OFX>/i);
  if (!ofxMatch) {
    throw new Error('Invalid OFX SGML: Missing OFX root element');
  }
  
  const ofxContent = ofxMatch[1];
  
  // Extract SIGNONMSGSRSV1
  const signOnMatch = ofxContent.match(/<SIGNONMSGSRSV1>([\s\S]*?)<\/SIGNONMSGSRSV1>/i);
  if (signOnMatch) {
    result.SIGNONMSGSRSV1 = parseSGMLElement(signOnMatch[1]);
  }
  
  // Extract BANKMSGSRSV1
  const bankMatch = ofxContent.match(/<BANKMSGSRSV1>([\s\S]*?)<\/BANKMSGSRSV1>/i);
  if (bankMatch) {
    result.BANKMSGSRSV1 = parseSGMLElement(bankMatch[1]);
  }
  
  // Extract CREDITCARDMSGSRSV1
  const ccMatch = ofxContent.match(/<CREDITCARDMSGSRSV1>([\s\S]*?)<\/CREDITCARDMSGSRSV1>/i);
  if (ccMatch) {
    result.CREDITCARDMSGSRSV1 = parseSGMLElement(ccMatch[1]);
  }
  
  return result;
};

/**
 * Parse an SGML element and its children
 * @param content The SGML element content
 * @returns Parsed element structure
 */
const parseSGMLElement = (content: string): any => {
  const result: any = {};
  
  // Find all SGML elements at this level
  const elementRegex = /<([A-Z0-9_]+)>([\s\S]*?)<\/\1>|<([A-Z0-9_]+)>([^<]*)/gi;
  let match;
  
  while ((match = elementRegex.exec(content)) !== null) {
    const tagName = match[1] || match[3];
    const tagContent = match[2] || match[4] || '';
    
    // Check if content has child elements
    if (/<[A-Z0-9_]+>/i.test(tagContent)) {
      result[tagName] = parseSGMLElement(tagContent);
    } else {
      // It's a leaf node with just text content
      result[tagName] = tagContent.trim();
    }
  }
  
  return result;
};

/**
 * Extract sign-on message from parsed OFX 1.x data
 * @param parsedData The parsed OFX data
 * @returns Sign-on message information
 */
const extractSignOnMsg = (parsedData: any): OFXDocument['signOnMsg'] => {
  if (!parsedData.SIGNONMSGSRSV1 || !parsedData.SIGNONMSGSRSV1.SONRS) {
    return {
      statusCode: '0',
      statusSeverity: 'INFO',
      dtServer: new Date(),
      language: 'ENG'
    };
  }
  
  const sonrs = parsedData.SIGNONMSGSRSV1.SONRS;
  
  return {
    statusCode: sonrs.STATUS?.CODE || '0',
    statusSeverity: sonrs.STATUS?.SEVERITY || 'INFO',
    statusMessage: sonrs.STATUS?.MESSAGE,
    dtServer: parseOFXDate(sonrs.DTSERVER),
    language: sonrs.LANGUAGE || 'ENG',
    dtProfUp: sonrs.DTPROFUP ? parseOFXDate(sonrs.DTPROFUP) : undefined,
    dtAcctUp: sonrs.DTACCTUP ? parseOFXDate(sonrs.DTACCTUP) : undefined,
    fi: sonrs.FI ? {
      name: sonrs.FI.ORG || '',
      id: sonrs.FI.FID || '',
      org: sonrs.FI.ORG || '',
      fid: sonrs.FI.FID || ''
    } : undefined
  };
};

/**
 * Extract sign-on message from parsed OFX 2.x data
 * @param parsedData The parsed OFX data
 * @returns Sign-on message information
 */
const extractSignOnMsgXML = (parsedData: any): OFXDocument['signOnMsg'] => {
  // Similar to extractSignOnMsg but adapted for XML format
  if (!parsedData.SIGNONMSGSRSV1 || !parsedData.SIGNONMSGSRSV1.SONRS) {
    return {
      statusCode: '0',
      statusSeverity: 'INFO',
      dtServer: new Date(),
      language: 'ENG'
    };
  }
  
  const sonrs = parsedData.SIGNONMSGSRSV1.SONRS;
  
  return {
    statusCode: sonrs.STATUS?.CODE || '0',
    statusSeverity: sonrs.STATUS?.SEVERITY || 'INFO',
    statusMessage: sonrs.STATUS?.MESSAGE,
    dtServer: parseOFXDate(sonrs.DTSERVER),
    language: sonrs.LANGUAGE || 'ENG',
    dtProfUp: sonrs.DTPROFUP ? parseOFXDate(sonrs.DTPROFUP) : undefined,
    dtAcctUp: sonrs.DTACCTUP ? parseOFXDate(sonrs.DTACCTUP) : undefined,
    fi: sonrs.FI ? {
      name: sonrs.FI.ORG || '',
      id: sonrs.FI.FID || '',
      org: sonrs.FI.ORG || '',
      fid: sonrs.FI.FID || ''
    } : undefined
  };
};

/**
 * Extract statements from parsed OFX 1.x data
 * @param parsedData The parsed OFX data
 * @returns Array of OFX statements
 */
const extractStatements = (parsedData: any): OFXStatement[] => {
  const statements: OFXStatement[] = [];
  
  // Extract bank statements
  if (parsedData.BANKMSGSRSV1 && parsedData.BANKMSGSRSV1.STMTTRNRS) {
    const stmtTrnRs = Array.isArray(parsedData.BANKMSGSRSV1.STMTTRNRS) 
      ? parsedData.BANKMSGSRSV1.STMTTRNRS 
      : [parsedData.BANKMSGSRSV1.STMTTRNRS];
    
    stmtTrnRs.forEach((trnrs: any) => {
      if (trnrs.STMTRS) {
        const stmtrs = trnrs.STMTRS;
        const acctinfo = stmtrs.BANKACCTFROM || {};
        
        const statement: OFXStatement = {
          currency: stmtrs.CURDEF || 'USD',
          bankId: acctinfo.BANKID,
          accountId: acctinfo.ACCTID || '',
          accountType: acctinfo.ACCTTYPE || 'CHECKING',
          startDate: parseOFXDate(stmtrs.BANKTRANLIST?.DTSTART),
          endDate: parseOFXDate(stmtrs.BANKTRANLIST?.DTEND),
          transactions: extractTransactions(stmtrs.BANKTRANLIST)
        };
        
        // Extract balances
        if (stmtrs.LEDGERBAL) {
          statement.ledgerBalance = {
            amount: parseFloat(stmtrs.LEDGERBAL.BALAMT || '0'),
            date: parseOFXDate(stmtrs.LEDGERBAL.DTASOF),
            type: 'ledger'
          };
        }
        
        if (stmtrs.AVAILBAL) {
          statement.availableBalance = {
            amount: parseFloat(stmtrs.AVAILBAL.BALAMT || '0'),
            date: parseOFXDate(stmtrs.AVAILBAL.DTASOF),
            type: 'available'
          };
        }
        
        statements.push(statement);
      }
    });
  }
  
  // Extract credit card statements
  if (parsedData.CREDITCARDMSGSRSV1 && parsedData.CREDITCARDMSGSRSV1.CCSTMTTRNRS) {
    const ccStmtTrnRs = Array.isArray(parsedData.CREDITCARDMSGSRSV1.CCSTMTTRNRS) 
      ? parsedData.CREDITCARDMSGSRSV1.CCSTMTTRNRS 
      : [parsedData.CREDITCARDMSGSRSV1.CCSTMTTRNRS];
    
    ccStmtTrnRs.forEach((trnrs: any) => {
      if (trnrs.CCSTMTRS) {
        const stmtrs = trnrs.CCSTMTRS;
        const acctinfo = stmtrs.CCACCTFROM || {};
        
        const statement: OFXStatement = {
          currency: stmtrs.CURDEF || 'USD',
          accountId: acctinfo.ACCTID || '',
          accountType: 'CREDITCARD',
          startDate: parseOFXDate(stmtrs.BANKTRANLIST?.DTSTART),
          endDate: parseOFXDate(stmtrs.BANKTRANLIST?.DTEND),
          transactions: extractTransactions(stmtrs.BANKTRANLIST)
        };
        
        // Extract balances
        if (stmtrs.LEDGERBAL) {
          statement.ledgerBalance = {
            amount: parseFloat(stmtrs.LEDGERBAL.BALAMT || '0'),
            date: parseOFXDate(stmtrs.LEDGERBAL.DTASOF),
            type: 'ledger'
          };
        }
        
        statements.push(statement);
      }
    });
  }
  
  return statements;
};

/**
 * Extract statements from parsed OFX 2.x data
 * @param parsedData The parsed OFX data
 * @returns Array of OFX statements
 */
const extractStatementsXML = (parsedData: any): OFXStatement[] => {
  // Similar to extractStatements but adapted for XML format
  return extractStatements(parsedData); // The structure is similar enough that we can reuse the function
};

/**
 * Extract transactions from a bank transaction list
 * @param tranList The transaction list from OFX data
 * @returns Array of OFX transactions
 */
const extractTransactions = (tranList: any): OFXTransaction[] => {
  if (!tranList || !tranList.STMTTRN) {
    return [];
  }
  
  const transactions = Array.isArray(tranList.STMTTRN) 
    ? tranList.STMTTRN 
    : [tranList.STMTTRN];
  
  return transactions.map((trn: any) => {
    return {
      id: trn.FITID || uuidv4(),
      date: parseOFXDate(trn.DTPOSTED),
      amount: parseFloat(trn.TRNAMT || '0'),
      name: trn.NAME,
      memo: trn.MEMO,
      payee: trn.PAYEE,
      checkNumber: trn.CHECKNUM,
      refNumber: trn.REFNUM,
      type: trn.TRNTYPE,
      sic: trn.SIC
    };
  });
};

/**
 * Parse an OFX date string into a Date object
 * @param dateStr The OFX date string
 * @returns A Date object
 */
export const parseOFXDate = (dateStr?: string): Date => {
  if (!dateStr) {
    return new Date();
  }
  
  // OFX dates can be in several formats
  // YYYYMMDD
  // YYYYMMDDHHMMSS
  // YYYYMMDDHHMMSS.XXX
  
  // Remove any timezone indicator and milliseconds
  const cleanDateStr = dateStr.replace(/\[.*\]/, '').split('.')[0];
  
  if (cleanDateStr.length === 8) {
    // YYYYMMDD format
    const year = parseInt(cleanDateStr.substring(0, 4));
    const month = parseInt(cleanDateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(cleanDateStr.substring(6, 8));
    return new Date(year, month, day);
  } else if (cleanDateStr.length >= 14) {
    // YYYYMMDDHHMMSS format
    const year = parseInt(cleanDateStr.substring(0, 4));
    const month = parseInt(cleanDateStr.substring(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(cleanDateStr.substring(6, 8));
    const hour = parseInt(cleanDateStr.substring(8, 10));
    const minute = parseInt(cleanDateStr.substring(10, 12));
    const second = parseInt(cleanDateStr.substring(12, 14));
    return new Date(year, month, day, hour, minute, second);
  }
  
  // If we can't parse it, return current date
  return new Date();
};

/**
 * Convert OFX transactions to app Transaction objects
 * @param ofxTransactions Array of OFX transactions
 * @param accountId The account ID to associate with these transactions
 * @param fieldMapping Mapping between OFX fields and app fields
 * @returns Array of app Transaction objects
 */
export const convertOFXToTransactions = (
  ofxTransactions: OFXTransaction[],
  accountId: string,
  fieldMapping: Partial<OFXFieldMapping> = {}
): Transaction[] => {
  // Default field mapping if not provided
  const mapping: OFXFieldMapping = {
    date: 'date',
    amount: 'amount',
    payee: 'name', // Default to NAME field for payee
    description: 'memo', // Default to MEMO field for description
    checkNumber: 'checkNumber',
    refNumber: 'refNumber',
    ...fieldMapping
  };
  
  return ofxTransactions.map(ofxTx => {
    // Determine transaction type
    let transactionType: TransactionType = 'expense';
    if (ofxTx.amount > 0) {
      transactionType = 'income';
    } else if (ofxTx.type === 'XFER' || ofxTx.type === 'TRANSFER') {
      transactionType = 'transfer';
    }
    
    // Get payee from the mapped field
    const payee = ofxTx[mapping.payee] || '';
    
    // Get description from the mapped field
    const description = ofxTx[mapping.description] || '';
    
    // Create the transaction object
    return {
      id: `ofx-${ofxTx.id}`,
      accountId,
      date: ofxTx.date,
      payee: typeof payee === 'string' ? payee : '',
      amount: Math.abs(ofxTx.amount), // Store amount as positive
      type: transactionType,
      categoryId: '', // Will be categorized later
      description: typeof description === 'string' ? description : '',
      isReconciled: false,
      isCleared: true, // OFX transactions are typically cleared
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSplit: false
    } as Transaction;
  });
};

/**
 * Import from OFX/QFX file and return preview data
 * @param fileUri The URI of the OFX/QFX file
 * @returns Promise resolving to ImportData
 */
export const importFromOFX = async (fileUri: string): Promise<ImportData> => {
  try {
    console.log('[DEBUG] OFX Import: Starting importFromOFX', { fileUri });
    
    // Parse the OFX file
    const parseResult = await parseOFXFile(fileUri);
    
    if (parseResult.error) {
      console.error('[DEBUG] OFX Import: Error in parse result', { error: parseResult.error });
      throw new Error(parseResult.error);
    }
    
    console.log('[DEBUG] OFX Import: OFX file parsed successfully', {
      transactionCount: parseResult.transactions.length,
      statementCount: parseResult.statements.length
    });
    
    // Create preview data
    const preview = parseResult.transactions.map(tx => ({
      id: tx.id,
      date: tx.date.toISOString().split('T')[0],
      amount: tx.amount.toString(),
      payee: tx.name || tx.payee || '',
      description: tx.memo || '',
      checkNumber: tx.checkNumber || '',
      refNumber: tx.refNumber || '',
      type: tx.type || ''
    }));
    
    // Create headers
    const headers = ['date', 'amount', 'payee', 'description', 'checkNumber', 'refNumber', 'type'];
    
    return {
      preview: preview.slice(0, 5), // Show first 5 transactions as preview
      headers,
      format: 'ofx'
    };
  } catch (error) {
    console.error('OFX import error:', error);
    throw error;
  }
};

/**
 * Detect duplicate transactions by comparing OFX transactions with existing ones
 * @param newTransactions New transactions from OFX import
 * @param existingTransactions Existing transactions in the app
 * @returns Object containing duplicates and unique transactions
 */
export const detectDuplicateOFXTransactions = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): TransactionMatchResult => {
  const duplicates: Transaction[] = [];
  const unique: Transaction[] = [];
  const updated: Transaction[] = [];
  
  // Check each new transaction against existing ones
  newTransactions.forEach(newTx => {
    // Extract the original OFX ID from our generated ID
    const ofxId = newTx.id.startsWith('ofx-') ? newTx.id.substring(4) : newTx.id;
    
    // Look for existing transaction with the same OFX ID
    const existingWithSameId = existingTransactions.find(
      existingTx => existingTx.id.includes(ofxId)
    );
    
    if (existingWithSameId) {
      duplicates.push(newTx);
      
      // Check if we need to update the existing transaction
      const needsUpdate = (
        existingWithSameId.amount !== newTx.amount ||
        existingWithSameId.payee !== newTx.payee ||
        existingWithSameId.description !== newTx.description
      );
      
      if (needsUpdate) {
        // Create updated transaction with existing ID but new details
        updated.push({
          ...existingWithSameId,
          amount: newTx.amount,
          payee: newTx.payee,
          description: newTx.description,
          updatedAt: new Date()
        });
      }
    } else {
      // Look for potential duplicates based on date, amount, and payee
      const potentialDuplicate = existingTransactions.find(
        existingTx => 
          existingTx.date.getTime() === newTx.date.getTime() &&
          Math.abs(existingTx.amount - newTx.amount) < 0.001 && // Allow for tiny rounding differences
          existingTx.payee === newTx.payee
      );
      
      if (potentialDuplicate) {
        duplicates.push(newTx);
      } else {
        unique.push(newTx);
      }
    }
  });
  
  return { duplicates, unique, updated };
};

/**
 * Verify account balance against imported OFX statement
 * @param accountId The account ID
 * @param statement The OFX statement
 * @param currentBalance The current account balance
 * @returns Object with verification result
 */
export const verifyAccountBalance = (
  accountId: string,
  statement: OFXStatement,
  currentBalance: number
): { isVerified: boolean; difference: number } => {
  if (!statement.ledgerBalance) {
    return { isVerified: false, difference: 0 };
  }
  
  const statementBalance = statement.ledgerBalance.amount;
  const difference = currentBalance - statementBalance;
  
  // Consider verified if difference is very small (accounting for rounding)
  const isVerified = Math.abs(difference) < 0.01;
  
  return { isVerified, difference };
};
