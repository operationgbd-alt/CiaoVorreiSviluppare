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
  caption?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

export type InterventionStatus = 
  | 'assegnato'        
  | 'appuntamento_fissato' 
  | 'in_corso'         
  | 'completato'
  | 'chiuso';

export type InterventionCategory = 
  | 'sopralluogo'
  | 'installazione'
  | 'manutenzione';

export interface Intervention {
  id: string;
  number: string;
  
  client: ClientInfo;
  
  companyId: string | null;
  companyName: string | null;
  
  technicianId: string | null;
  technicianName: string | null;
  
  category: InterventionCategory;
  description: string;
  priority: 'bassa' | 'normale' | 'alta' | 'urgente';
  
  assignedAt: number;
  assignedBy: string;
  
  appointment?: {
    date: number;
    confirmedAt: number;
    notes: string;
  };
  
  location?: Location;
  
  documentation: {
    photos: Photo[];
    notes: string;
    startedAt?: number;
    completedAt?: number;
  };
  
  status: InterventionStatus;
  
  createdAt: number;
  updatedAt: number;
}

export type AppointmentType = 'intervento';

export interface Appointment {
  id: string;
  type: AppointmentType;
  interventionId: string;
  clientName: string;
  address: string;
  date: number;
  notes: string;
  notifyBefore: number | null;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  companyName: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  role: 'master' | 'ditta' | 'tecnico';
  name: string;
  email: string;
  phone?: string;
  companyId: string | null;
  companyName: string | null;
  createdAt: number;
}
