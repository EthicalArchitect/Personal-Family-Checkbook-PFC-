
export enum TransactionCategory {
  GROCERIES = 'Groceries',
  UTILITIES = 'Utilities',
  RENT_MORTGAGE = 'Rent/Mortgage',
  TRANSPORTATION = 'Transportation',
  DINING_OUT = 'Dining Out',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTHCARE = 'Healthcare',
  INCOME = 'Income',
  OTHER = 'Other',
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number; // negative for expenses, positive for income
  category: TransactionCategory;
  date: string; // ISO string
}

export interface FamilyAccount {
  id: string;
  passphrase: string;
  users: User[];
  transactions: Transaction[];
  name: string;
}

export interface ParsedReceipt {
    merchant: string;
    total: number;
    category: TransactionCategory;
    description: string;
}

export interface AuthState {
  familyAccountId: string;
  currentUserId: string;
}
