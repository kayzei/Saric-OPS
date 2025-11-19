import { Asset, AssetStatus, Shipment, Invoice, Driver, Project, FatigueStatus, MaintenanceRecord, Document, TelemetryPoint } from './types';

// Helper to generate mock telemetry
const generateHistory = (baseSpeed: number): TelemetryPoint[] => {
    const points: TelemetryPoint[] = [];
    let currentFuel = 90;
    for (let i = 0; i < 10; i++) {
        points.push({
            time: `${12 + i}:00`,
            speed: Math.max(0, baseSpeed + (Math.random() * 20 - 10)),
            fuel: currentFuel,
            rpm: 1200 + Math.random() * 500
        });
        currentFuel -= (Math.random() * 2);
    }
    return points;
};

// --- PROJECTS ---
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-KANS-24',
    name: 'Kansanshi Mine Expansion Phase 3',
    client: 'First Quantum Minerals',
    location: 'Solwezi, North-Western',
    startDate: '2024-01-15',
    completionDate: '2025-06-30',
    status: 'Active',
    progress: 45,
    budget: 12500000,
    assetsAssigned: ['SRC-205', 'SRC-550', 'SRC-601']
  },
  {
    id: 'PRJ-LND-RD',
    name: 'Lusaka-Ndola Dual Carriageway',
    client: 'RDA / Macro Ocean',
    location: 'Great North Road Corridor',
    startDate: '2024-03-01',
    completionDate: '2026-12-01',
    status: 'Active',
    progress: 15,
    budget: 45000000,
    assetsAssigned: ['SRC-410', 'SRC-104', 'SRC-CRN-01']
  },
  {
    id: 'PRJ-KGL-PWR',
    name: 'Kafue Gorge Lower Logistics',
    client: 'ZESCO',
    location: 'Chikankata',
    startDate: '2023-11-01',
    completionDate: '2024-08-15',
    status: 'Planning',
    progress: 0,
    budget: 3200000,
    assetsAssigned: []
  },
  {
    id: 'PRJ-MNG-AID',
    name: 'Western Province Relief Supply',
    client: 'DMMU / WFP',
    location: 'Mongu',
    startDate: '2024-05-01',
    completionDate: '2024-06-01',
    status: 'Active',
    progress: 78,
    budget: 1500000,
    assetsAssigned: ['SRC-702', 'SRC-888']
  },
  {
    id: 'PRJ-KKIA-SHT',
    name: 'KKIA Corporate Shuttle Service',
    client: 'Saric Travel / NAC',
    location: 'Lusaka',
    startDate: '2024-01-01',
    completionDate: '2025-12-31',
    status: 'Active',
    progress: 100,
    budget: 850000,
    assetsAssigned: ['SRC-SHT-01', 'SRC-SHT-02']
  }
];

// --- DRIVERS ---
export const INITIAL_DRIVERS: Driver[] = [
  { 
      id: 'DRV-001', 
      name: 'Kennedy Mumba', 
      licenseNumber: 'ZM-1992-882', 
      assignedAssetId: 'SRC-104', 
      status: 'On Duty', 
      clockInTime: '2024-05-20T06:00:00', 
      drivingHoursToday: 5.5, 
      fatigueLevel: FatigueStatus.OK, 
      complianceScore: 98,
      messages: [
          { id: 'm1', sender: 'Driver', content: 'Arrived at Kabwe weighbridge. Slight delay due to queue.', timestamp: '2024-05-20T09:30:00', isRead: true, type: 'General' },
          { id: 'm2', sender: 'HR', content: 'Copy that Kennedy. Let us know when you clear.', timestamp: '2024-05-20T09:35:00', isRead: true, type: 'General' }
      ]
  },
  { 
      id: 'DRV-002', 
      name: 'Joseph Phiri', 
      licenseNumber: 'ZM-1988-112', 
      assignedAssetId: 'SRC-205', 
      status: 'Resting', 
      clockInTime: '2024-05-20T05:30:00', 
      drivingHoursToday: 8.2, 
      fatigueLevel: FatigueStatus.TIRED, 
      complianceScore: 85,
      messages: [
          { id: 'm3', sender: 'Driver', content: 'Requesting leave for next Tuesday (Medical checkup).', timestamp: '2024-05-19T16:00:00', isRead: false, type: 'Request' }
      ]
  },
  { id: 'DRV-003', name: 'Isaac Banda', licenseNumber: 'ZM-1995-331', assignedAssetId: 'SRC-330', status: 'On Duty', clockInTime: '2024-05-20T08:00:00', drivingHoursToday: 3.0, fatigueLevel: FatigueStatus.FRESH, complianceScore: 100, messages: [] },
  { id: 'DRV-004', name: 'Peter Mulenga', licenseNumber: 'ZM-1990-555', assignedAssetId: 'SRC-410', status: 'Off Duty', drivingHoursToday: 0, fatigueLevel: FatigueStatus.FRESH, complianceScore: 92, messages: [] },
  { 
      id: 'DRV-005', 
      name: 'Chanda Weza', 
      licenseNumber: 'ZM-1985-772', 
      assignedAssetId: 'SRC-550', 
      status: 'On Duty', 
      clockInTime: '2024-05-19T22:00:00', 
      drivingHoursToday: 11.5, 
      fatigueLevel: FatigueStatus.CRITICAL, 
      complianceScore: 65,
      messages: [
          { id: 'm4', sender: 'HR', content: 'URGENT: Chanda, you have exceeded max driving hours. Pull over immediately.', timestamp: '2024-05-20T10:00:00', isRead: false, type: 'Urgent' }
      ]
  },
  { id: 'DRV-006', name: 'Emmanuel Zulu', licenseNumber: 'ZM-1993-001', assignedAssetId: 'SRC-601', status: 'On Duty', clockInTime: '2024-05-20T07:15:00', drivingHoursToday: 4.5, fatigueLevel: FatigueStatus.OK, complianceScore: 95, messages: [] },
  { id: 'DRV-007', name: 'Abel Mwale', licenseNumber: 'ZM-1989-223', assignedAssetId: 'SRC-702', status: 'Resting', clockInTime: '2024-05-20T04:00:00', drivingHoursToday: 9.0, fatigueLevel: FatigueStatus.TIRED, complianceScore: 88, messages: [] },
  { id: 'DRV-008', name: 'Silas Lungu', licenseNumber: 'ZM-1998-449', assignedAssetId: 'SRC-888', status: 'On Duty', clockInTime: '2024-05-20T09:00:00', drivingHoursToday: 1.5, fatigueLevel: FatigueStatus.FRESH, complianceScore: 99, messages: [] },
  { id: 'DRV-009', name: 'Mary Kunda', licenseNumber: 'ZM-1999-123', assignedAssetId: 'SRC-SHT-01', status: 'On Duty', clockInTime: '2024-05-20T05:00:00', drivingHoursToday: 6.0, fatigueLevel: FatigueStatus.OK, complianceScore: 100, messages: [] },
  { id: 'DRV-010', name: 'John Tembo', licenseNumber: 'ZM-1987-456', assignedAssetId: 'SRC-CRN-01', status: 'On Duty', clockInTime: '2024-05-20T07:00:00', drivingHoursToday: 2.0, fatigueLevel: FatigueStatus.FRESH, complianceScore: 97, messages: [] },
];

// --- ASSETS ---
export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'SRC-104',
    name: 'Scania R500',
    category: 'Heavy Transport',
    driver: 'Kennedy Mumba',
    driverId: 'DRV-001',
    projectId: 'PRJ-LND-RD',
    status: AssetStatus.MOVING,
    location: { lat: -14.4265, lng: 28.4396 }, // Kabwe
    destination: { lat: -12.9587, lng: 28.6366 }, // Ndola
    cargoType: 'Road Base Materials',
    speed: 75,
    fuelLevel: 82,
    lastServiceDate: '2024-04-10',
    nextServiceMileage: 1500,
    revenueMonthToDate: 45000,
    costMonthToDate: 12000,
    co2Emissions: 1240,
    telemetryHistory: generateHistory(75)
  },
  {
    id: 'SRC-205',
    name: 'Volvo FH16',
    category: 'Heavy Transport',
    driver: 'Joseph Phiri',
    driverId: 'DRV-002',
    projectId: 'PRJ-KANS-24',
    status: AssetStatus.IDLE,
    location: { lat: -12.1689, lng: 26.3927 }, // Solwezi
    destination: { lat: -12.5373, lng: 27.8458 }, // Chingola
    cargoType: 'Copper Concentrates',
    speed: 0,
    fuelLevel: 45,
    temperature: 25,
    lastServiceDate: '2024-03-15',
    nextServiceMileage: 500,
    revenueMonthToDate: 68000,
    costMonthToDate: 18000,
    co2Emissions: 2100,
    telemetryHistory: generateHistory(0)
  },
  {
    id: 'SRC-330',
    name: 'Mercedes Actros',
    category: 'Heavy Transport',
    driver: 'Isaac Banda',
    driverId: 'DRV-003',
    projectId: undefined,
    status: AssetStatus.MOVING,
    location: { lat: -15.9534, lng: 28.8657 }, // Chirundu
    destination: { lat: -15.3875, lng: 28.3228 }, // Lusaka
    cargoType: 'Imported Goods',
    speed: 68,
    fuelLevel: 90,
    lastServiceDate: '2024-05-01',
    nextServiceMileage: 8000,
    revenueMonthToDate: 32000,
    costMonthToDate: 8500,
    co2Emissions: 890,
    telemetryHistory: generateHistory(68)
  },
  {
    id: 'SRC-410',
    name: 'Freightliner',
    category: 'Heavy Transport',
    driver: 'Peter Mulenga',
    driverId: 'DRV-004',
    projectId: 'PRJ-LND-RD',
    status: AssetStatus.BREAKDOWN,
    location: { lat: -10.5087, lng: 31.8129 }, // Chinsali
    destination: { lat: -12.8024, lng: 28.2132 }, // Kitwe
    cargoType: 'Construction Steel',
    speed: 0,
    fuelLevel: 15,
    lastServiceDate: '2023-12-20',
    nextServiceMileage: -200,
    revenueMonthToDate: 12000,
    costMonthToDate: 24000, // High cost due to breakdown
    co2Emissions: 450,
    telemetryHistory: generateHistory(0)
  },
  {
    id: 'SRC-550',
    name: 'Scania G460 Tipper',
    category: 'Construction',
    driver: 'Chanda Weza',
    driverId: 'DRV-005',
    projectId: 'PRJ-KANS-24',
    status: AssetStatus.MOVING,
    location: { lat: -12.2000, lng: 26.4500 }, // Near Solwezi
    destination: { lat: -12.1689, lng: 26.3927 }, // Mine Site
    cargoType: 'Overburden',
    speed: 45,
    fuelLevel: 30,
    lastServiceDate: '2024-04-20',
    nextServiceMileage: 1200,
    revenueMonthToDate: 55000,
    costMonthToDate: 15000,
    co2Emissions: 3200,
    telemetryHistory: generateHistory(45)
  },
  {
    id: 'SRC-601',
    name: 'DAF XF105',
    category: 'Heavy Transport',
    driver: 'Emmanuel Zulu',
    driverId: 'DRV-006',
    projectId: 'PRJ-KANS-24',
    status: AssetStatus.MOVING,
    location: { lat: -12.3489, lng: 27.8265 }, // Kasumbalesa Border route
    destination: { lat: -11.9383, lng: 27.8624 }, // Kasumbalesa
    cargoType: 'Fuel Tanker',
    speed: 60,
    fuelLevel: 95,
    lastServiceDate: '2024-05-05',
    nextServiceMileage: 9000,
    revenueMonthToDate: 72000,
    costMonthToDate: 14000,
    co2Emissions: 1800,
    telemetryHistory: generateHistory(60)
  },
  {
    id: 'SRC-702',
    name: 'Iveco Trakker',
    category: 'Heavy Transport',
    driver: 'Abel Mwale',
    driverId: 'DRV-007',
    projectId: 'PRJ-MNG-AID',
    status: AssetStatus.STOPPED,
    location: { lat: -15.2724, lng: 23.1487 }, // Mongu
    destination: { lat: -14.9416, lng: 24.1754 }, // Kaoma
    cargoType: 'Maize Meal',
    speed: 0,
    fuelLevel: 55,
    lastServiceDate: '2024-02-10',
    nextServiceMileage: 3000,
    revenueMonthToDate: 28000,
    costMonthToDate: 6000,
    co2Emissions: 900,
    telemetryHistory: generateHistory(0)
  },
  {
    id: 'SRC-888',
    name: 'Mercedes Axor',
    category: 'Heavy Transport',
    driver: 'Silas Lungu',
    driverId: 'DRV-008',
    projectId: 'PRJ-MNG-AID',
    status: AssetStatus.MOVING,
    location: { lat: -17.8419, lng: 25.8528 }, // Livingstone
    destination: { lat: -16.5430, lng: 26.0030 }, // Kalomo
    cargoType: 'Relief Tents',
    speed: 82,
    fuelLevel: 70,
    lastServiceDate: '2024-03-30',
    nextServiceMileage: 4500,
    revenueMonthToDate: 31000,
    costMonthToDate: 7500,
    co2Emissions: 1100,
    telemetryHistory: generateHistory(82)
  },
  // --- NEW ASSETS: SHUTTLES & OTHERS ---
  {
    id: 'SRC-SHT-01',
    name: 'Toyota Coaster',
    category: 'Shuttle',
    driver: 'Mary Kunda',
    driverId: 'DRV-009',
    projectId: 'PRJ-KKIA-SHT',
    status: AssetStatus.MOVING,
    location: { lat: -15.3275, lng: 28.4426 }, // Near KKIA Lusaka
    destination: { lat: -15.4167, lng: 28.2833 }, // Lusaka CBD
    cargoType: 'Passengers (18)',
    speed: 55,
    fuelLevel: 60,
    lastServiceDate: '2024-05-10',
    nextServiceMileage: 2500,
    revenueMonthToDate: 15000,
    costMonthToDate: 3000,
    co2Emissions: 200,
    telemetryHistory: generateHistory(55)
  },
  {
    id: 'SRC-SHT-02',
    name: 'Toyota Hiace Quantum',
    category: 'Shuttle',
    driver: 'Unassigned',
    projectId: 'PRJ-KKIA-SHT',
    status: AssetStatus.IDLE,
    location: { lat: -15.4167, lng: 28.2833 }, // Lusaka
    destination: { lat: -15.4167, lng: 28.2833 },
    cargoType: 'Passengers (14)',
    speed: 0,
    fuelLevel: 88,
    lastServiceDate: '2024-05-18',
    nextServiceMileage: 4000,
    revenueMonthToDate: 8000,
    costMonthToDate: 1500,
    co2Emissions: 150,
    telemetryHistory: generateHistory(0)
  },
  {
    id: 'SRC-CRN-01',
    name: 'Liebherr LTM 1050',
    category: 'Construction',
    driver: 'John Tembo',
    driverId: 'DRV-010',
    projectId: 'PRJ-LND-RD',
    status: AssetStatus.STOPPED,
    location: { lat: -14.4265, lng: 28.4396 }, // Kabwe Site
    destination: { lat: -14.4265, lng: 28.4396 },
    cargoType: 'Mobile Crane',
    speed: 0,
    fuelLevel: 40,
    lastServiceDate: '2024-03-01',
    nextServiceMileage: 500,
    revenueMonthToDate: 90000, // High daily rate
    costMonthToDate: 25000,
    co2Emissions: 4000, // High consumption
    telemetryHistory: generateHistory(0)
  },
  {
    id: 'SRC-REC-01',
    name: 'Scania Tow Truck',
    category: 'Support',
    driver: 'Standby Crew',
    status: AssetStatus.IDLE,
    location: { lat: -12.9587, lng: 28.6366 }, // Ndola Hub
    destination: { lat: -12.9587, lng: 28.6366 },
    cargoType: 'Breakdown Recovery',
    speed: 0,
    fuelLevel: 98,
    lastServiceDate: '2024-05-15',
    nextServiceMileage: 10000,
    revenueMonthToDate: 5000,
    costMonthToDate: 2000,
    co2Emissions: 100,
    telemetryHistory: generateHistory(0)
  }
];

// --- SHIPMENTS ---
export const INITIAL_SHIPMENTS: Shipment[] = [
  { id: 'SAR-8821', origin: 'Lusaka, ZM', destination: 'Ndola, ZM', client: 'Mopani Copper', eta: '3 hrs', status: 'In Transit', assetId: 'SRC-104' },
  { id: 'SAR-9923', origin: 'Solwezi, ZM', destination: 'Chingola, ZM', client: 'FQM', eta: 'Pending', status: 'Pending', assetId: 'SRC-205' },
  { id: 'SAR-4141', origin: 'Chirundu, ZM', destination: 'Lusaka, ZM', client: 'Trade Kings', eta: '5 hrs', status: 'In Transit', assetId: 'SRC-330' },
  { id: 'SAR-1010', origin: 'Mpika, ZM', destination: 'Nakonde, ZM', client: 'Government', eta: 'Delayed', status: 'Delayed', assetId: 'SRC-410', delayReason: 'Border clearance bottleneck at Nakonde' },
  { id: 'SAR-2022', origin: 'Lusaka, ZM', destination: 'Mongu, ZM', client: 'DMMU', eta: '8 hrs', status: 'In Transit', assetId: 'SRC-702' },
  { id: 'SAR-SHT-101', origin: 'KKIA Airport', destination: 'Radisson Blu', client: 'Emirates Crew', eta: '30 mins', status: 'In Transit', assetId: 'SRC-SHT-01' },
  // Historic / Delivered
  { id: 'SAR-7701', origin: 'Kapiri Mposhi, ZM', destination: 'Mkushi, ZM', client: 'AgriCo', eta: 'Delivered', status: 'Delivered', assetId: 'SRC-104' },
  { id: 'SAR-6655', origin: 'Livingstone, ZM', destination: 'Lusaka, ZM', client: 'Tourism Board', eta: 'Delivered', status: 'Delivered', assetId: 'SRC-888' }
];

// --- INVOICES ---
export const INITIAL_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', customer: 'First Quantum Minerals', tpin: '1001992832', date: '2024-05-15', amount: 450000, vat: 72000, status: 'Fiscalised', zraSignature: 'ZRA-ESD-88219-GEN', items: 'Heavy Equipment Transport (Solwezi)', auditTrail: [{timestamp: '2024-05-15 14:30', action: 'Generated', user: 'System'}, {timestamp: '2024-05-15 14:35', action: 'Fiscalised via ESD', user: 'SARIC-ADMIN'}] },
  { id: 'INV-2024-002', customer: 'Mopani Copper Mines', tpin: '1002883711', date: '2024-05-18', amount: 125000, vat: 20000, status: 'Pending', items: 'Copper Cathode Logistics', auditTrail: [{timestamp: '2024-05-18 09:00', action: 'Draft Created', user: 'Finance-01'}] },
  { id: 'INV-2024-003', customer: 'ZESCO Limited', tpin: '1000004455', date: '2024-05-19', amount: 89000, vat: 14240, status: 'Fiscalised', zraSignature: 'ZRA-ESD-11029-GEN', items: 'Transformer Delivery (Kafue Gorge)', auditTrail: [] },
  { id: 'INV-2024-004', customer: 'Shoprite Zambia', tpin: '1003991122', date: '2024-05-20', amount: 54000, vat: 8640, status: 'Pending', items: 'Fresh Produce Distribution', auditTrail: [] },
  { id: 'INV-2024-005', customer: 'Emirates Airlines', tpin: '1009922331', date: '2024-05-21', amount: 12000, vat: 1920, status: 'Fiscalised', zraSignature: 'ZRA-ESD-55412-GEN', items: 'Monthly Crew Shuttle Services', auditTrail: [] },
];

// --- MAINTENANCE RECORDS ---
export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
    { id: 'MNT-2024-001', assetId: 'SRC-410', type: 'Repair', date: '2024-05-21', cost: 15000, mechanic: 'Lusaka Heavy Duty Wksp', notes: 'Transmission failure. Towing arranged.', status: 'In Progress' },
    { id: 'MNT-2024-002', assetId: 'SRC-104', type: 'Routine', date: '2024-04-10', cost: 5000, mechanic: 'Ndola Service Center', notes: 'Oil change, filter replacement, brake check.', status: 'Completed' },
    { id: 'MNT-2024-003', assetId: 'SRC-205', type: 'Tire Change', date: '2024-05-25', cost: 12000, mechanic: 'Solwezi Hub', notes: 'Rear axle tires replacement due.', status: 'Scheduled' },
    { id: 'MNT-2024-004', assetId: 'SRC-601', type: 'Inspection', date: '2024-05-05', cost: 1500, mechanic: 'Kasumbalesa Mobile Unit', notes: 'Border crossing compliance check. Passed.', status: 'Completed' },
];

// --- DOCUMENTS ---
export const INITIAL_DOCUMENTS: Document[] = [
    { id: 'DOC-882', title: 'Signed POD - Mopani', type: 'POD', relatedId: 'SAR-8821', dateUploaded: '2024-05-19', size: '2.4 MB', url: '#' },
    { id: 'DOC-883', title: 'Customs Clearance Form CN1', type: 'Permit', relatedId: 'SAR-4141', dateUploaded: '2024-05-18', size: '1.1 MB', url: '#' },
    { id: 'DOC-884', title: 'Fleet Insurance Policy 2024', type: 'Insurance', relatedId: 'General', dateUploaded: '2024-01-01', size: '5.6 MB', url: '#' },
    { id: 'DOC-885', title: 'Invoice #INV-001 Copy', type: 'Invoice', relatedId: 'INV-2024-001', dateUploaded: '2024-05-15', size: '0.8 MB', url: '#' },
    { id: 'DOC-886', title: 'Bill of Lading - Durban to Lusaka', type: 'Bill of Lading', relatedId: 'SAR-4141', dateUploaded: '2024-05-17', size: '3.2 MB', url: '#' },
];