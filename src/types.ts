export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Lodging'
  | 'Entertainment'
  | 'Utilities'
  | 'Shopping'
  | 'Other'
  | 'Settlement';

export interface Member {
  id: string;
  name: string;
}

export interface Split {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidById: string; // The member who paid
  categoryId: ExpenseCategory;
  splitType: 'equal' | 'unequal' | 'percentage' | 'shares';
  splits: Split[]; // How much each member owes
  notes?: string;
  isSettlement?: boolean; // If true, this is a settlement payment rather than an actual expense
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Member[];
  expenses: Expense[];
  currency: string; // e.g. '$', '€', '£', etc.
  createdAt: string;
}

export interface Debt {
  from: string; // Member ID who owes
  to: string;   // Member ID who is owed
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  paid: number;
  owed: number;
  net: number; // paid - owed
}
