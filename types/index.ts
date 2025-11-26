export type ProductSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE' | '8kW' | '10kW' | '15kW' | '20kW' | 'Altro';

export type YesNoValue = 'SI' | 'NO' | null;

export type SurveyStatus = 'da_completare' | 'completato';
export type InstallationStatus = 'programmata' | 'in_corso' | 'completata';
export type AppointmentType = 'sopralluogo' | 'installazione';

export interface ChecklistItem {
  id: string;
  value: YesNoValue;
  notes: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  civicNumber: string;
  cap: string;
  city: string;
  phone: string;
  email: string;
}

export interface Photo {
  id: string;
  uri: string;
  timestamp: number;
}

export interface Survey {
  id: string;
  client: ClientInfo;
  technicianId: string;
  technicianName: string;
  productSize: ProductSize | null;
  createdAt: number;
  updatedAt: number;
  status: SurveyStatus;
  checklistA1: Record<string, ChecklistItem>;
  checklistA2: Record<string, ChecklistItem>;
  checklistB: Record<string, ChecklistItem>;
  photos: Photo[];
  notes: string;
}

export interface InstallationItem {
  id: string;
  description: string;
  amount: number;
}

export type InterventionType = 
  | 'intervento_tecnico'
  | 'caldaia'
  | 'scaldabagno'
  | 'climatizzatore'
  | 'elettrodomestico'
  | 'varie';

export type DetailType =
  | 'uscita_ore_comprese'
  | 'uscita_ore_pagamento'
  | 'pezzi_ricambio'
  | 'preventivo'
  | 'riparazione'
  | 'manutenzione';

export interface Installation {
  id: string;
  interventionNumber: string;
  date: number;
  client: ClientInfo;
  technicianId: string;
  technicianName: string;
  companyName: string;
  interventionType: InterventionType | null;
  detailTypes: DetailType[];
  extraHours: number;
  plantDetails: string;
  interventionDetails: string;
  items: InstallationItem[];
  totalAmount: number;
  prescriptionOk: boolean;
  prescriptionReason: string;
  observations: string;
  photos: Photo[];
  status: InstallationStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Appointment {
  id: string;
  type: AppointmentType;
  clientName: string;
  address: string;
  date: number;
  notes: string;
  notifyBefore: number | null;
  relatedId?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  companyName: string;
  avatar?: string;
}
