import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Intervention, Appointment, Technician } from '@/types';

interface AppState {
  technician: Technician | null;
  isLoggedIn: boolean;
  interventions: Intervention[];
  appointments: Appointment[];
}

interface AppContextType extends AppState {
  login: (technician: Technician) => void;
  logout: () => void;
  addIntervention: (intervention: Intervention) => void;
  updateIntervention: (id: string, updates: Partial<Intervention>) => void;
  deleteIntervention: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getInterventionById: (id: string) => Intervention | undefined;
}

const defaultTechnician: Technician = {
  id: 'tech-001',
  name: 'Marco Rossi',
  email: 'marco.rossi@solartech.it',
  companyName: 'SolarTech Italia S.r.l.',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const mockInterventions: Intervention[] = [
  {
    id: 'int-001',
    number: 'INT-2025-001',
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
    category: 'installazione',
    description: 'Installazione impianto fotovoltaico 6kW con sistema di accumulo.',
    priority: 'alta',
    assignedAt: Date.now() - 86400000 * 2,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'int-002',
    number: 'INT-2025-002',
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
    category: 'sopralluogo',
    description: 'Sopralluogo per verifica stato impianto esistente e preventivo manutenzione.',
    priority: 'normale',
    assignedAt: Date.now() - 86400000,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() + 86400000 * 2 + 3600000 * 10,
      confirmedAt: Date.now() - 3600000 * 5,
      notes: 'Cliente disponibile solo al mattino',
    },
    status: 'appuntamento_fissato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'int-003',
    number: 'INT-2025-003',
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
    category: 'installazione',
    description: 'Installazione sistema di accumulo aggiuntivo 5kWh.',
    priority: 'urgente',
    assignedAt: Date.now() - 3600000 * 4,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() + 3600000 * 2,
      confirmedAt: Date.now() - 3600000 * 2,
      notes: 'Urgente - cliente senza produzione',
    },
    status: 'appuntamento_fissato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'int-004',
    number: 'INT-2025-004',
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
    category: 'sopralluogo',
    description: 'Sopralluogo per preventivo nuovo impianto 10kW',
    priority: 'bassa',
    assignedAt: Date.now() - 86400000 * 3,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'int-005',
    number: 'INT-2025-005',
    client: {
      name: 'Franco Colombo',
      address: 'Via Dante',
      civicNumber: '15',
      cap: '40121',
      city: 'Bologna',
      phone: '+39 051 9988776',
      email: 'f.colombo@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    category: 'installazione',
    description: 'Installazione impianto fotovoltaico 4kW residenziale.',
    priority: 'normale',
    assignedAt: Date.now() - 86400000 * 5,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() - 86400000,
      confirmedAt: Date.now() - 86400000 * 3,
      notes: '',
    },
    location: {
      latitude: 44.4949,
      longitude: 11.3426,
      address: 'Via Dante 15, Bologna',
      timestamp: Date.now() - 86400000,
    },
    status: 'completato',
    documentation: {
      photos: [],
      notes: 'Configurazione completata. App installata e funzionante. Cliente istruito sull\'utilizzo.',
      startedAt: Date.now() - 86400000 - 3600000,
      completedAt: Date.now() - 86400000,
    },
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'int-006',
    number: 'INT-2025-006',
    client: {
      name: 'Roberto Mancini',
      address: 'Via Venezia',
      civicNumber: '22',
      cap: '35121',
      city: 'Padova',
      phone: '+39 049 7766554',
      email: 'r.mancini@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    category: 'manutenzione',
    description: 'Manutenzione ordinaria impianto 8kW. Pulizia pannelli e controllo inverter.',
    priority: 'normale',
    assignedAt: Date.now() - 86400000 * 2,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'int-007',
    number: 'INT-2025-007',
    client: {
      name: 'Giulia Ferrari',
      address: 'Via Milano',
      civicNumber: '88',
      cap: '24121',
      city: 'Bergamo',
      phone: '+39 035 4455667',
      email: 'g.ferrari@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    category: 'manutenzione',
    description: 'Sostituzione inverter guasto e verifica produzione.',
    priority: 'alta',
    assignedAt: Date.now() - 86400000,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() + 86400000 * 3,
      confirmedAt: Date.now() - 3600000 * 2,
      notes: 'Portare inverter sostitutivo',
    },
    status: 'appuntamento_fissato',
    documentation: {
      photos: [],
      notes: '',
    },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'int-008',
    number: 'INT-2025-008',
    client: {
      name: 'Stefano Conti',
      address: 'Via Verona',
      civicNumber: '56',
      cap: '37121',
      city: 'Verona',
      phone: '+39 045 8899001',
      email: 's.conti@email.it',
    },
    technicianId: 'tech-001',
    technicianName: 'Marco Rossi',
    category: 'manutenzione',
    description: 'Controllo annuale e ottimizzazione sistema di accumulo.',
    priority: 'bassa',
    assignedAt: Date.now() - 86400000 * 4,
    assignedBy: 'Admin',
    status: 'completato',
    location: {
      latitude: 45.4384,
      longitude: 10.9916,
      address: 'Via Verona 56, Verona',
      timestamp: Date.now() - 86400000 * 2,
    },
    documentation: {
      photos: [],
      notes: 'Batteria efficienza al 92%. Sistema ottimizzato.',
      startedAt: Date.now() - 86400000 * 2 - 3600000,
      completedAt: Date.now() - 86400000 * 2,
    },
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    type: 'intervento',
    interventionId: 'int-002',
    clientName: 'Anna Bianchi',
    address: 'Corso Vittorio Emanuele 120, Torino',
    date: Date.now() + 86400000 * 2 + 3600000 * 10,
    notes: 'Cliente disponibile solo al mattino',
    notifyBefore: 60,
  },
  {
    id: 'apt-002',
    type: 'intervento',
    interventionId: 'int-003',
    clientName: 'Maria Russo',
    address: 'Via Garibaldi 33, Firenze',
    date: Date.now() + 3600000 * 2,
    notes: 'Urgente - cliente senza produzione',
    notifyBefore: 30,
  },
];

const initialState: AppState = {
  technician: defaultTechnician,
  isLoggedIn: true,
  interventions: mockInterventions,
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

  const addIntervention = useCallback((intervention: Intervention) => {
    setState(prev => ({
      ...prev,
      interventions: [{ ...intervention, id: intervention.id || generateId() }, ...prev.interventions],
    }));
  }, []);

  const updateIntervention = useCallback((id: string, updates: Partial<Intervention>) => {
    setState(prev => ({
      ...prev,
      interventions: prev.interventions.map(i =>
        i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i
      ),
    }));
  }, []);

  const deleteIntervention = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      interventions: prev.interventions.filter(i => i.id !== id),
    }));
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setState(prev => ({
      ...prev,
      appointments: [...prev.appointments, { ...appointment, id: appointment.id || generateId() }],
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

  const getInterventionById = useCallback((id: string) => {
    return state.interventions.find(i => i.id === id);
  }, [state.interventions]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        addIntervention,
        updateIntervention,
        deleteIntervention,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getInterventionById,
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
