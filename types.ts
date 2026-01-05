
import React from 'react';

export enum AssetStatus {
  MOVING = 'MOVING',
  IDLE = 'IDLE',
  STOPPED = 'STOPPED',
  BREAKDOWN = 'BREAKDOWN',
  MAINTENANCE = 'MAINTENANCE'
}

export type CommTopic = 'chat:general' | 'chat:ops' | 'radio:dispatch_log' | 'chat:personnel';

// Added AssetCategory type
export type AssetCategory = 'Heavy Transport' | 'Shuttle' | 'Construction' | 'Support';

// Added TelemetryPoint interface
export interface TelemetryPoint {
  time: string;
  speed: number;
  fuel: number;
  rpm: number;
}

export interface MessagePayload {
  text: string;
  type: 'text' | 'voice' | 'radio_packet';
  sender_id: string;
  sender_name: string;
  sender_role: 'CEO' | 'ADMIN' | 'HR' | 'EMPLOYEE' | 'DRIVER';
  is_radio?: boolean;
  duration?: string;
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

export interface Profile {
  id: string;
  fullName: string;
  role: 'admin' | 'user' | 'DRIVER' | 'CEO' | 'HR';
  department: string;
  avatarUrl?: string;
  email?: string;
  onDuty?: boolean;
  noSim?: boolean; // NEW: Track signal loss/SIM status
  lastActive?: string;
  currentTask?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  driver: string;
  driverId?: string;
  projectId?: string; // Added to support project assignments
  status: AssetStatus;
  location: Coordinates;
  locationName?: string;
  destination: Coordinates;
  cargoType: string;
  speed: number;
  fuelLevel: number;
  temperature?: number; // Added for telemetry data
  lastServiceDate?: string; // Added for maintenance tracking
  nextServiceMileage?: number; // Added for maintenance tracking
  revenueMonthToDate?: number;
  costMonthToDate?: number;
  co2Emissions?: number;
  telemetryHistory?: TelemetryPoint[]; // Added for graphing
}

// Added ZraTaxType for invoicing compliance
export type ZraTaxType = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'X';

// Added InvoiceItem for granular billing
export interface InvoiceItem {
  id: string;
  description: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  taxType: ZraTaxType;
  total: number;
}

// Added AuditEntry for financial tracking
export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
}

export interface Invoice {
  id: string;
  customer: string;
  tpin: string;
  currency: 'ZMW' | 'USD';
  exchangeRate?: number; // Added for multi-currency support
  date: string;
  amount: number;
  vat: number;
  status: 'Fiscalised' | 'Pending' | 'Failed';
  zraSignature?: string;
  items: string;
  lineItems?: InvoiceItem[]; // Added for detailed view
  auditTrail?: AuditEntry[]; // Added for compliance
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  date: string;
}

// Added DriverMessage interface
export interface DriverMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'General' | 'Request' | 'Urgent';
}

// Added Driver interface
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  assignedAssetId: string;
  status: 'On Duty' | 'Off Duty' | 'Resting';
  clockInTime?: string;
  drivingHoursToday: number;
  fatigueLevel: FatigueStatus;
  complianceScore: number;
  messages: DriverMessage[];
}

// Added Shipment interface
export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  client: string;
  eta: string;
  status: 'In Transit' | 'Pending' | 'Delivered' | 'Delayed';
  assetId?: string;
  delayReason?: string;
}

// Added Document interface
export interface Document {
  id: string;
  title: string;
  type: string;
  relatedId: string;
  dateUploaded: string;
  size: string;
  url: string;
}

// Added Geofence interface
export interface Geofence {
  id: string;
  name: string;
  type: string;
  color: string;
  coordinates: [number, number][];
}

// Added AppNotification interface
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

// Added SecurityEvent interface
export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  userId: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  details: string;
}
