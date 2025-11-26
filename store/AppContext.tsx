import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Survey, Installation, Appointment, Technician } from '@/types';

interface AppState {
  technician: Technician | null;
  isLoggedIn: boolean;
  surveys: Survey[];
  installations: Installation[];
  appointments: Appointment[];
}

interface AppContextType extends AppState {
  login: (technician: Technician) => void;
  logout: () => void;
  addSurvey: (survey: Survey) => void;
  updateSurvey: (id: string, survey: Partial<Survey>) => void;
  deleteSurvey: (id: string) => void;
  addInstallation: (installation: Installation) => void;
  updateInstallation: (id: string, installation: Partial<Installation>) => void;
  deleteInstallation: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
}

const defaultTechnician: Technician = {
  id: 'tech-001',
  name: 'Marco Rossi',
  email: 'marco.rossi@solartech.it',
  companyName: 'SolarTech Italia S.r.l.',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const mockSurveys: Survey[] = [
  {
    id: 'srv-001',
    client: {
      name: 'Giuseppe Verdi',
      address: 'Via Roma',
      civicNumber: '45',
      cap: '20121',
      city: 'Milano',
      phone: '+39 02 1234567',
      email: 'g.verdi@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    productSize: 'MEDIUM',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
    status: 'completato',
    checklistA1: {},
    checklistA2: {},
    checklistB: {},
    photos: [],
    notes: 'Tetto in ottime condizioni, esposizione sud.',
  },
  {
    id: 'srv-002',
    client: {
      name: 'Anna Bianchi',
      address: 'Corso Vittorio Emanuele',
      civicNumber: '120',
      cap: '10121',
      city: 'Torino',
      phone: '+39 011 9876543',
      email: 'a.bianchi@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    productSize: 'LARGE',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    status: 'da_completare',
    checklistA1: {},
    checklistA2: {},
    checklistB: {},
    photos: [],
    notes: '',
  },
  {
    id: 'srv-003',
    client: {
      name: 'Luigi Esposito',
      address: 'Via Napoli',
      civicNumber: '78',
      cap: '80121',
      city: 'Napoli',
      phone: '+39 081 5554433',
      email: 'l.esposito@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    productSize: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'da_completare',
    checklistA1: {},
    checklistA2: {},
    checklistB: {},
    photos: [],
    notes: '',
  },
];

const mockInstallations: Installation[] = [
  {
    id: 'inst-001',
    interventionNumber: 'ODL-2024-001',
    date: Date.now() + 86400000 * 3,
    client: {
      name: 'Giuseppe Verdi',
      address: 'Via Roma',
      civicNumber: '45',
      cap: '20121',
      city: 'Milano',
      phone: '+39 02 1234567',
      email: 'g.verdi@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    companyName: 'SolarTech Italia S.r.l.',
    interventionType: 'varie',
    detailTypes: ['uscita_ore_comprese'],
    extraHours: 0,
    plantDetails: 'Impianto fotovoltaico 6kW con storage',
    interventionDetails: 'Installazione pannelli e inverter',
    items: [
      { id: '1', description: 'Pannelli solari 400W x15', amount: 4500 },
      { id: '2', description: 'Inverter ibrido 6kW', amount: 1800 },
      { id: '3', description: 'Batteria 10kWh', amount: 3200 },
    ],
    totalAmount: 9500,
    prescriptionOk: true,
    prescriptionReason: '',
    observations: '',
    photos: [],
    status: 'programmata',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'inst-002',
    interventionNumber: 'ODL-2024-002',
    date: Date.now(),
    client: {
      name: 'Maria Russo',
      address: 'Via Garibaldi',
      civicNumber: '33',
      cap: '50123',
      city: 'Firenze',
      phone: '+39 055 1122334',
      email: 'm.russo@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    companyName: 'SolarTech Italia S.r.l.',
    interventionType: 'climatizzatore',
    detailTypes: ['riparazione', 'pezzi_ricambio'],
    extraHours: 2,
    plantDetails: 'Sistema di climatizzazione multi-split',
    interventionDetails: 'Sostituzione compressore e ricarica gas',
    items: [
      { id: '1', description: 'Compressore ricondizionato', amount: 450 },
      { id: '2', description: 'Ricarica gas R32', amount: 120 },
    ],
    totalAmount: 570,
    prescriptionOk: true,
    prescriptionReason: '',
    observations: 'Cliente soddisfatto del lavoro svolto',
    photos: [],
    status: 'in_corso',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now(),
  },
];

const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    type: 'sopralluogo',
    clientName: 'Luigi Esposito',
    address: 'Via Napoli 78, Napoli',
    date: Date.now() + 3600000 * 2,
    notes: 'Chiamare prima di arrivare',
    notifyBefore: 30,
    relatedId: 'srv-003',
  },
  {
    id: 'apt-002',
    type: 'installazione',
    clientName: 'Giuseppe Verdi',
    address: 'Via Roma 45, Milano',
    date: Date.now() + 86400000 * 3 + 3600000 * 9,
    notes: 'Portare scala estensibile',
    notifyBefore: 60,
    relatedId: 'inst-001',
  },
  {
    id: 'apt-003',
    type: 'sopralluogo',
    clientName: 'Franco Colombo',
    address: 'Via Dante 15, Bologna',
    date: Date.now() + 86400000 * 5,
    notes: '',
    notifyBefore: 15,
  },
];

const initialState: AppState = {
  technician: defaultTechnician,
  isLoggedIn: true,
  surveys: mockSurveys,
  installations: mockInstallations,
  appointments: mockAppointments,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const login = useCallback((technician: Technician) => {
    setState(prev => ({ ...prev, technician, isLoggedIn: true }));
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({ ...prev, technician: null, isLoggedIn: false }));
  }, []);

  const addSurvey = useCallback((survey: Survey) => {
    setState(prev => ({
      ...prev,
      surveys: [{ ...survey, id: generateId() }, ...prev.surveys],
    }));
  }, []);

  const updateSurvey = useCallback((id: string, updates: Partial<Survey>) => {
    setState(prev => ({
      ...prev,
      surveys: prev.surveys.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ),
    }));
  }, []);

  const deleteSurvey = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      surveys: prev.surveys.filter(s => s.id !== id),
    }));
  }, []);

  const addInstallation = useCallback((installation: Installation) => {
    setState(prev => ({
      ...prev,
      installations: [{ ...installation, id: generateId() }, ...prev.installations],
    }));
  }, []);

  const updateInstallation = useCallback((id: string, updates: Partial<Installation>) => {
    setState(prev => ({
      ...prev,
      installations: prev.installations.map(i =>
        i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i
      ),
    }));
  }, []);

  const deleteInstallation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      installations: prev.installations.filter(i => i.id !== id),
    }));
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      appointments: [...prev.appointments, { ...appointment, id: generateId() }],
    }));
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      appointments: prev.appointments.filter(a => a.id !== id),
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        addInstallation,
        updateInstallation,
        deleteInstallation,
        addAppointment,
        updateAppointment,
        deleteAppointment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
