import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Intervention, Appointment, Company, User } from '@/types';
import { useAuth } from './AuthContext';

interface AppContextType {
  interventions: Intervention[];
  appointments: Appointment[];
  companies: Company[];
  users: User[];
  allInterventionsCount: number;
  unassignedInterventions: Intervention[];
  addIntervention: (intervention: Omit<Intervention, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => void;
  updateIntervention: (id: string, updates: Partial<Intervention>) => void;
  deleteIntervention: (id: string) => void;
  bulkAssignToCompany: (interventionIds: string[], companyId: string, companyName: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getInterventionById: (id: string) => Intervention | undefined;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getCompanyById: (id: string) => Company | undefined;
  getUsersByCompany: (companyId: string) => User[];
  getGlobalStats: () => {
    totalInterventions: number;
    byStatus: Record<string, number>;
    byCompany: { companyId: string; companyName: string; count: number }[];
    totalCompanies: number;
    totalTechnicians: number;
    unassignedCount: number;
  };
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

let interventionCounter = 9;
const generateInterventionNumber = () => {
  interventionCounter++;
  return `INT-2025-${String(interventionCounter).padStart(3, '0')}`;
};

const initialCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'GBD B&A S.r.l.',
    address: 'Via Milano 123, Milano',
    phone: '+39 02 12345678',
    email: 'info@gbd-ba.it',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'company-2',
    name: 'Solar Pro S.r.l.',
    address: 'Via Roma 45, Roma',
    phone: '+39 06 87654321',
    email: 'info@solarpro.it',
    createdAt: Date.now() - 86400000 * 20,
  },
];

const initialUsers: User[] = [
  {
    id: 'master-1',
    username: 'gbd',
    role: 'master',
    name: 'GBD Amministratore',
    email: 'admin@gbd.it',
    phone: '+39 02 00000000',
    companyId: null,
    companyName: null,
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'ditta-1',
    username: 'ditta',
    role: 'ditta',
    name: 'GBD B&A',
    email: 'info@gbd-ba.it',
    phone: '+39 02 12345678',
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ditta-2',
    username: 'solarpro',
    role: 'ditta',
    name: 'Solar Pro',
    email: 'info@solarpro.it',
    phone: '+39 06 87654321',
    companyId: 'company-2',
    companyName: 'Solar Pro S.r.l.',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'tech-1',
    username: 'alex',
    role: 'tecnico',
    name: 'Alessandro Rossi',
    email: 'alex@gbd-ba.it',
    phone: '+39 333 1234567',
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'tech-2',
    username: 'billo',
    role: 'tecnico',
    name: 'Marco Bianchi',
    email: 'billo@gbd-ba.it',
    phone: '+39 333 7654321',
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'tech-3',
    username: 'luca',
    role: 'tecnico',
    name: 'Luca Verdi',
    email: 'luca@solarpro.it',
    phone: '+39 333 9988776',
    companyId: 'company-2',
    companyName: 'Solar Pro S.r.l.',
    createdAt: Date.now() - 86400000 * 15,
  },
];

const allInterventions: Intervention[] = [
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: 'tech-1',
    technicianName: 'Alessandro Rossi',
    category: 'installazione',
    description: 'Installazione impianto fotovoltaico 6kW con sistema di accumulo.',
    priority: 'alta',
    assignedAt: Date.now() - 86400000 * 2,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: 'tech-1',
    technicianName: 'Alessandro Rossi',
    category: 'sopralluogo',
    description: 'Sopralluogo per verifica stato impianto esistente.',
    priority: 'normale',
    assignedAt: Date.now() - 86400000,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() + 86400000 * 2 + 3600000 * 10,
      confirmedAt: Date.now() - 3600000 * 5,
      notes: 'Cliente disponibile solo al mattino',
    },
    status: 'appuntamento_fissato',
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: 'tech-2',
    technicianName: 'Marco Bianchi',
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
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: null,
    technicianName: null,
    category: 'sopralluogo',
    description: 'Sopralluogo per preventivo nuovo impianto 10kW - DA ASSEGNARE',
    priority: 'bassa',
    assignedAt: Date.now() - 86400000 * 3,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: 'tech-1',
    technicianName: 'Alessandro Rossi',
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
      notes: 'Installazione completata. Cliente soddisfatto.',
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
    companyId: 'company-1',
    companyName: 'GBD B&A S.r.l.',
    technicianId: 'tech-2',
    technicianName: 'Marco Bianchi',
    category: 'manutenzione',
    description: 'Manutenzione ordinaria impianto 8kW.',
    priority: 'normale',
    assignedAt: Date.now() - 86400000 * 2,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-2',
    companyName: 'Solar Pro S.r.l.',
    technicianId: 'tech-3',
    technicianName: 'Luca Verdi',
    category: 'manutenzione',
    description: 'Sostituzione inverter guasto.',
    priority: 'alta',
    assignedAt: Date.now() - 86400000,
    assignedBy: 'Admin',
    appointment: {
      date: Date.now() + 86400000 * 3,
      confirmedAt: Date.now() - 3600000 * 2,
      notes: 'Portare inverter sostitutivo',
    },
    status: 'appuntamento_fissato',
    documentation: { photos: [], notes: '' },
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
    companyId: 'company-2',
    companyName: 'Solar Pro S.r.l.',
    technicianId: 'tech-3',
    technicianName: 'Luca Verdi',
    category: 'manutenzione',
    description: 'Controllo annuale sistema di accumulo.',
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
      notes: 'Batteria efficienza al 92%.',
      startedAt: Date.now() - 86400000 * 2 - 3600000,
      completedAt: Date.now() - 86400000 * 2,
    },
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'int-009',
    number: 'INT-2025-009',
    client: {
      name: 'Roberto Neri',
      address: 'Via Trieste',
      civicNumber: '22',
      cap: '34121',
      city: 'Trieste',
      phone: '+39 040 1122334',
      email: 'r.neri@email.it',
    },
    companyId: null,
    companyName: null,
    technicianId: null,
    technicianName: null,
    category: 'installazione',
    description: 'Nuovo impianto fotovoltaico 8kW - NON ASSEGNATO',
    priority: 'alta',
    assignedAt: Date.now() - 86400000,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'int-010',
    number: 'INT-2025-010',
    client: {
      name: 'Paola Galli',
      address: 'Via Padova',
      civicNumber: '88',
      cap: '35121',
      city: 'Padova',
      phone: '+39 049 5566778',
      email: 'p.galli@email.it',
    },
    companyId: null,
    companyName: null,
    technicianId: null,
    technicianName: null,
    category: 'sopralluogo',
    description: 'Sopralluogo per ampliamento impianto esistente - NON ASSEGNATO',
    priority: 'normale',
    assignedAt: Date.now() - 86400000 * 2,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'int-011',
    number: 'INT-2025-011',
    client: {
      name: 'Fabio Moretti',
      address: 'Via Venezia',
      civicNumber: '45',
      cap: '30121',
      city: 'Venezia',
      phone: '+39 041 9988001',
      email: 'f.moretti@email.it',
    },
    companyId: null,
    companyName: null,
    technicianId: null,
    technicianName: null,
    category: 'manutenzione',
    description: 'Manutenzione straordinaria inverter - NON ASSEGNATO',
    priority: 'urgente',
    assignedAt: Date.now() - 3600000 * 6,
    assignedBy: 'Admin',
    status: 'assegnato',
    documentation: { photos: [], notes: '' },
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
  },
];

const allAppointments: Appointment[] = [
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
    notes: 'Urgente',
    notifyBefore: 30,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [interventionsData, setInterventionsData] = useState<Intervention[]>(allInterventions);
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>(allAppointments);
  const [companiesData, setCompaniesData] = useState<Company[]>(initialCompanies);
  const [usersData, setUsersData] = useState<User[]>(initialUsers);

  const interventions = useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'master':
        return interventionsData;
      case 'ditta':
        return interventionsData.filter(i => i.companyId === user.companyId);
      case 'tecnico':
        return interventionsData.filter(i =>
          i.companyId === user.companyId &&
          (i.technicianId === user.id || i.technicianId === null)
        );
      default:
        return [];
    }
  }, [user, interventionsData]);

  const appointments = useMemo(() => {
    if (!user) return [];
    const visibleIds = new Set(interventions.map(i => i.id));
    return appointmentsData.filter(a =>
      a.interventionId ? visibleIds.has(a.interventionId) : true
    );
  }, [user, appointmentsData, interventions]);

  const companies = useMemo(() => {
    if (!user) return [];
    if (user.role === 'master') return companiesData;
    if (user.role === 'ditta') return companiesData.filter(c => c.id === user.companyId);
    return [];
  }, [user, companiesData]);

  const users = useMemo(() => {
    if (!user) return [];
    if (user.role === 'master') return usersData;
    if (user.role === 'ditta') return usersData.filter(u => u.companyId === user.companyId);
    return [];
  }, [user, usersData]);

  const addIntervention = useCallback((intervention: Omit<Intervention, 'id' | 'number' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newIntervention: Intervention = {
      ...intervention,
      id: generateId(),
      number: generateInterventionNumber(),
      createdAt: now,
      updatedAt: now,
    };
    setInterventionsData(prev => [newIntervention, ...prev]);
  }, []);

  const updateIntervention = useCallback((id: string, updates: Partial<Intervention>) => {
    setInterventionsData(prev =>
      prev.map(i => (i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i))
    );
  }, []);

  const deleteIntervention = useCallback((id: string) => {
    setInterventionsData(prev => prev.filter(i => i.id !== id));
  }, []);

  const bulkAssignToCompany = useCallback((interventionIds: string[], companyId: string, companyName: string) => {
    const now = Date.now();
    setInterventionsData(prev =>
      prev.map(i =>
        interventionIds.includes(i.id)
          ? { 
              ...i, 
              companyId, 
              companyName, 
              assignedAt: now,
              assignedBy: 'Admin',
              status: 'assegnato' as const,
              updatedAt: now,
            }
          : i
      )
    );
  }, []);

  const unassignedInterventions = useMemo(() => {
    return interventionsData.filter(i => !i.companyId);
  }, [interventionsData]);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointmentsData(prev => [...prev, { ...appointment, id: appointment.id || generateId() }]);
  }, []);

  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointmentsData(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const deleteAppointment = useCallback((id: string) => {
    setAppointmentsData(prev => prev.filter(a => a.id !== id));
  }, []);

  const getInterventionById = useCallback(
    (id: string) => interventionsData.find(i => i.id === id),
    [interventionsData]
  );

  const addCompany = useCallback((company: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...company,
      id: generateId(),
      createdAt: Date.now(),
    };
    setCompaniesData(prev => [...prev, newCompany]);
  }, []);

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    setCompaniesData(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompaniesData(prev => prev.filter(c => c.id !== id));
  }, []);

  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: generateId(),
      createdAt: Date.now(),
    };
    setUsersData(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsersData(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsersData(prev => prev.filter(u => u.id !== id));
  }, []);

  const getCompanyById = useCallback(
    (id: string) => companiesData.find(c => c.id === id),
    [companiesData]
  );

  const getUsersByCompany = useCallback(
    (companyId: string) => usersData.filter(u => u.companyId === companyId),
    [usersData]
  );

  const getGlobalStats = useCallback(() => {
    const byStatus: Record<string, number> = {};
    const byCompanyMap: Record<string, { companyName: string; count: number }> = {};

    interventionsData.forEach(i => {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
      if (i.companyId) {
        if (!byCompanyMap[i.companyId]) {
          byCompanyMap[i.companyId] = { companyName: i.companyName || 'Senza Ditta', count: 0 };
        }
        byCompanyMap[i.companyId].count++;
      }
    });

    const byCompany = Object.entries(byCompanyMap).map(([companyId, data]) => ({
      companyId,
      companyName: data.companyName,
      count: data.count,
    }));

    const unassignedCount = interventionsData.filter(i => !i.companyId).length;

    return {
      totalInterventions: interventionsData.length,
      byStatus,
      byCompany,
      totalCompanies: companiesData.length,
      totalTechnicians: usersData.filter(u => u.role === 'tecnico').length,
      unassignedCount,
    };
  }, [interventionsData, companiesData, usersData]);

  return (
    <AppContext.Provider
      value={{
        interventions,
        appointments,
        companies,
        users,
        allInterventionsCount: interventionsData.length,
        unassignedInterventions,
        addIntervention,
        updateIntervention,
        deleteIntervention,
        bulkAssignToCompany,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getInterventionById,
        addCompany,
        updateCompany,
        deleteCompany,
        addUser,
        updateUser,
        deleteUser,
        getCompanyById,
        getUsersByCompany,
        getGlobalStats,
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
