import React from 'react';

export enum AssetStatus {
  MOVING = 'MOVING',
  IDLE = 'IDLE',
  STOPPED = 'STOPPED',
  BREAKDOWN = 'BREAKDOWN',
  MAINTENANCE = 'MAINTENANCE'
}

export enum FatigueStatus {
  FRESH = 'FRESH',
  OK = 'OK',
  TIRED = 'TIRED',
  CRITICAL = 'CRITICAL'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Geofence {
    id: string;
    name: string;
    type: 'Hub' | 'Border' | 'Site' | 'Restricted';
    color: string;
    coordinates: [number, number][];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  lastUpdated: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  clockIn: string;
  clockOut?: string;
  date: string;
  mood: string;
}

export interface Profile {
  id: string;
  fullName: string;
  role: 'admin' | 'user';
  department: string;
  avatarUrl?: string;
  email?: string;
  lastActive?: string;
  currentTask?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  date: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'MFA_CHALLENGE' | 'PASSWORD_CHANGE' | 'UNAUTHORIZED_ACCESS' | 'SENSITIVE_DATA_EXPORT';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  details: string;
}

export interface DriverMessage {
  id: string;
  sender: 'HR' | 'Driver';
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'General' | 'Urgent' | 'Request';
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  assignedAssetId?: string;
  status: 'On Duty' | 'Off Duty' | 'Resting';
  clockInTime?: string;
  drivingHoursToday: number;
  lastRestBreak?: string;
  fatigueLevel: FatigueStatus;
  complianceScore: number;
  messages?: DriverMessage[];
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  completionDate: string;
  status: 'Active' | 'Completed' | 'Paused' | 'Planning';
  progress: number;
  budget: number;
  assetsAssigned: string[];
}

export type AssetCategory = 'Heavy Transport' | 'Shuttle' | 'Construction' | 'Support';

export interface TelemetryPoint {
  time: string;
  speed: number;
  fuel: number;
  rpm?: number;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  driver: string;
  driverId?: string;
  projectId?: string;
  status: AssetStatus;
  location: Coordinates;
  locationName?: string;
  destination: Coordinates;
  cargoType: string;
  speed: number;
  fuelLevel: number;
  temperature?: number;
  lastServiceDate?: string;
  nextServiceMileage?: number;
  revenueMonthToDate?: number;
  costMonthToDate?: number;
  co2Emissions?: number;
  telemetryHistory?: TelemetryPoint[];
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  client: string;
  eta: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed';
  assetId?: string;
  delayReason?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export type ZraTaxType = 'A' | 'B' | 'C1' | 'C2';

export interface InvoiceItem {
  id: string;
  description: string;
  hsCode?: string;
  quantity: number;
  unitPrice: number;
  taxType: ZraTaxType;
  total: number;
}

export interface Invoice {
  id: string;
  customer: string;
  tpin: string;
  currency: 'ZMW' | 'USD';
  exchangeRate?: number;
  date: string;
  amount: number;
  vat: number;
  status: 'Fiscalised' | 'Pending' | 'Failed';
  zraSignature?: string;
  items: string;
  lineItems: InvoiceItem[];
  auditTrail?: AuditEntry[];
}

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  type: 'Routine' | 'Repair' | 'Inspection' | 'Tire Change';
  date: string;
  cost: number;
  mechanic: string;
  notes: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
}

export interface Document {
  id: string;
  title: string;
  type: 'POD' | 'Invoice' | 'Bill of Lading' | 'Insurance' | 'Permit';
  relatedId: string;
  dateUploaded: string;
  size: string;
  url: string;
}

export interface BreakdownAlert {
  id: string;
  assetId: string;
  timestamp: Date;
  severity: 'Low' | 'Medium' | 'Critical';
  message: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}