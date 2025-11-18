import React from 'react';

export enum AssetStatus {
  MOVING = 'MOVING',
  IDLE = 'IDLE',
  STOPPED = 'STOPPED',
  BREAKDOWN = 'BREAKDOWN',
  MAINTENANCE = 'MAINTENANCE'
}

export enum FatigueStatus {
  FRESH = 'FRESH',     // 0-4 hours
  OK = 'OK',           // 4-8 hours
  TIRED = 'TIRED',     // 8-10 hours
  CRITICAL = 'CRITICAL' // >10 hours (Violation)
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
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
  clockInTime?: string; // ISO String
  drivingHoursToday: number;
  lastRestBreak?: string;
  fatigueLevel: FatigueStatus;
  complianceScore: number; // 0-100%
  messages?: DriverMessage[]; // New field for communication history
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  completionDate: string;
  status: 'Active' | 'Completed' | 'Paused' | 'Planning';
  progress: number; // 0-100
  budget: number; // ZMW
  assetsAssigned: string[]; // Asset IDs
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
  name: string; // e.g., Truck-001
  category: AssetCategory; // New field to distinguish asset types
  driver: string; // Display name
  driverId?: string; // Link to Driver object
  projectId?: string; // Link to Project
  status: AssetStatus;
  location: Coordinates;
  destination: Coordinates;
  cargoType: string;
  speed: number; // km/h
  fuelLevel: number; // %
  temperature?: number; // for reefer
  lastServiceDate?: string;
  nextServiceMileage?: number;
  // Financials & Analytics
  revenueMonthToDate?: number;
  costMonthToDate?: number;
  co2Emissions?: number; // kg
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
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
}

export interface Invoice {
  id: string;
  customer: string;
  tpin: string; // Tax Payer Identification Number
  date: string;
  amount: number; // ZMW
  vat: number; // ZMW (16%)
  status: 'Fiscalised' | 'Pending' | 'Failed';
  zraSignature?: string; // The hash returned by ESD
  items: string; // Summary of items
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
  relatedId: string; // Shipment ID or Asset ID
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