export enum FamilyRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum CategoryType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum BillStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERRIDE = "OVERRIDE",
  CANCELLED = "CANCELLED",
}

export enum RecurringInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum LoanType {
  MORTGAGE = "MORTGAGE",
  CAR = "CAR",
  PERSONAL = "PERSONAL",
  STUDENT = "STUDENT",
  CREDIT_CARD = "CREDIT_CARD",
  OTHER = "OTHER",
}

export enum LoanStatus {
  ACTIVE = "ACTIVE",
  PAID = "PAID",
  DEFAULTED = "DEFAULTED",
}

export enum TemplateInterval {
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum BillRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  role: FamilyRole;
  joinedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  type: CategoryType;
  budget: number | null;
  userId: string | null;
  familyId: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  dueDate: Date;
  status: BillStatus;
  notes: string | null;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  recurringEndDate: Date | null;
  isVariable: boolean;
  familyId: string | null;
  userId: string;
  paidBy: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  interestRate: number | null;
  monthlyPayment: number | null;
  startDate: Date;
  endDate: Date | null;
  type: LoanType;
  lender: string | null;
  notes: string | null;
  familyId: string | null;
  userId: string;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  interval: TemplateInterval;
  isVariable: boolean;
  notes: string | null;
  active: boolean;
  familyId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillRequest {
  id: string;
  billId: string;
  requesterId: string;
  status: BillRequestStatus;
  message: string | null;
  createdAt: Date;
}

export interface LlmConfig {
  id: string;
  userId: string;
  provider: string;
  apiKey: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  categoryId: string | null;
  familyId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
