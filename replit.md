# SolarTech - App Tecnici Fotovoltaici

## Overview
Applicazione mobile cross-platform (Android e iOS) per tecnici installatori di impianti fotovoltaici. Gestisce il workflow completo: assegnazione interventi da admin, programmazione appuntamenti, documentazione sul campo con foto/note e GPS, completamento e generazione report.

## Role-Based Access System (3 Tier)
- **MASTER (GBD Amministratore)**: Crea e gestisce tutte le ditte e tecnici
- **DITTA INSTALLATRICE**: Gestisce i propri tecnici, può chiudere definitivamente interventi e inviare email
- **TECNICO**: Lavoro sul campo, documentazione foto/note, GPS

## Project Architecture

### Stack
- **Framework**: Expo SDK 54 con React Native
- **Backend**: Express.js con PostgreSQL (pg driver)
- **Auth**: JWT con bcrypt per password hashing
- **Navigation**: React Navigation 7 con tab navigator
- **State Management**: React Context API (AuthContext + AppContext)
- **Styling**: React Native StyleSheet con design system personalizzato
- **Location**: expo-location per tracciamento GPS
- **Media**: expo-image-picker per foto documentazione

### Directory Structure
```
├── App.tsx                 # Entry point con providers
├── app.json               # Configurazione Expo
├── server/                # Backend Express.js
│   └── src/
│       ├── index.ts       # Server entry point (porta 3001)
│       ├── db.ts          # Connessione PostgreSQL e inizializzazione tabelle
│       └── routes/
│           ├── auth.ts    # Login, registrazione, middleware JWT
│           ├── users.ts   # CRUD utenti con controllo ruoli
│           └── interventions.ts # Gestione interventi
├── services/
│   └── api.ts             # Layer API per comunicazione frontend-backend
├── constants/
│   └── theme.ts           # Colori, spacing, typography
├── types/
│   └── index.ts           # TypeScript types per Intervention, Appointment, etc.
├── store/
│   ├── AuthContext.tsx    # Autenticazione con JWT e demo mode
│   └── AppContext.tsx     # Stato globale con dati interventi e appuntamenti
├── navigation/
│   ├── RootNavigator.tsx            # Switch Login/MainApp basato su auth
│   ├── MainTabNavigator.tsx         # Tab navigator (4 tab)
│   ├── DashboardStackNavigator.tsx
│   ├── InterventionsStackNavigator.tsx
│   ├── CompletedStackNavigator.tsx
│   └── ProfileStackNavigator.tsx
├── screens/
│   ├── LoginScreen.tsx              # Login con username/password
│   ├── DashboardScreen.tsx          # Home con statistiche
│   ├── CalendarScreen.tsx           # Calendario appuntamenti
│   ├── InterventionsListScreen.tsx  # Lista interventi attivi
│   ├── InterventionDetailScreen.tsx # Dettaglio con 5 sezioni
│   ├── CompletedInterventionsScreen.tsx # Archivio completati
│   └── ProfileScreen.tsx            # Profilo utente e logout
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx / ErrorFallback.tsx
│   ├── PhotoPicker.tsx
│   ├── HeaderTitle.tsx
│   ├── Screen*.tsx (scroll/keyboard/list helpers)
│   ├── Spacer.tsx
│   ├── ThemedText.tsx / ThemedView.tsx
│   └── KeyboardAwareScrollView.tsx
└── assets/
    └── images/
        └── icon.png
```

## Intervention Workflow Model

### Stati Intervento
1. **assegnato** - Nuovo intervento assegnato dall'admin
2. **appuntamento_fissato** - Appuntamento confermato con cliente
3. **in_corso** - Tecnico sul posto (GPS registrato)
4. **completato** - Lavoro terminato con documentazione

### Priorità
- bassa (grigio)
- normale (blu)
- alta (arancione)
- urgente (rosso)

### Categorie Intervento
- sopralluogo (viola)
- installazione (blu)
- manutenzione (arancione)

### Data Model (Intervention)
```typescript
{
  id, number, client, technicianId, technicianName,
  category, description, priority,
  assignedAt, assignedBy, status,
  appointment?: { date, confirmedAt, notes },
  location?: { latitude, longitude, address, timestamp },
  documentation: { photos, notes, startedAt?, completedAt? }
}
```

## Features

### Implemented (Phase 1 - UI/Workflow Prototype)
1. **Dashboard** - Statistiche interventi per stato, appuntamenti del giorno, attività recenti
2. **Lista Interventi** - 3 sezioni per categoria (Sopralluoghi, Installazioni, Manutenzioni)
3. **Dettaglio Intervento** - 5 sezioni: Dettaglio, Cliente (Chiama/Naviga), Calendario, Gestisci, Esita
4. **Programmazione Appuntamento** - Date picker, note, integrazione calendario
5. **Acquisizione GPS** - Registrazione posizione all'avvio intervento
6. **Documentazione** - Cattura foto con fotocamera/galleria, note lavoro
7. **Calendario** - Vista mensile appuntamenti
8. **Profilo** - Dati tecnico e impostazioni app

### Planned (Phase 2 - Backend Integration)
- API backend per sincronizzazione dati
- Sistema autenticazione tecnici
- Notifiche push admin-tecnici
- Generazione PDF report automatica
- Invio email automatico report
- Firma digitale cliente

## Design System

### Colors
- **Primary**: #0066CC (blu professionale)
- **Secondary**: #FF9500 (arancione - nuovi/warning)
- **Success**: #34C759 (completato)
- **Danger**: #FF3B30 (urgente)
- **Purple**: #5856D6 (in corso)

### Typography
- H1: 28pt Bold
- H2: 22pt Semibold
- H3: 18pt Semibold
- Body: 16pt Regular
- Caption: 12pt Regular

## User Preferences
- Lingua: Italiano
- Interfaccia ottimizzata per uso sul campo con pulsanti grandi
- Workflow unificato per tutti i tipi di intervento

## Recent Changes
- 2025-11-26: Implementato sistema autenticazione completo
  - Backend Express.js con PostgreSQL (porta 3001)
  - JWT authentication con bcrypt password hashing
  - Demo mode per testing senza backend attivo
  - Account demo: gbd/master123, ditta/ditta123, alex/tecnico123, billo/tecnico123
  - Logout con conferma (window.confirm su web, Alert.alert su native)
  - ProfileScreen mostra ruolo utente con badge colorato
- 2025-11-26: Aggiunto tab "Completati" per archivio interventi
  - 4 tab in navigazione: Dashboard, Interventi, Completati, Profilo
  - CompletedInterventionsScreen mostra solo interventi completati
  - InterventionsListScreen filtra automaticamente i completati
  - Navigazione separata CompletedStackNavigator
  - Usa ScreenFlatList per corretta gestione safe-area insets
- 2025-11-26: Lista interventi con 3 sezioni per categoria
  - Sopralluoghi (icona search, viola)
  - Installazioni (icona tool, blu)
  - Manutenzioni (icona settings, arancione)
  - Ogni sezione mostra conteggio interventi
  - Click su intervento apre scheda dettaglio
- 2025-11-26: Schermata dettaglio unificata con 5 sezioni
  - Dettaglio Intervento: info base sempre visibili
  - Cliente: contatti con solo Chiama e Naviga (rimosso Email)
  - Calendario: date/time picker integrato, espandibile
  - Gestisci Intervento: foto, GPS, note in sezione espandibile
  - Esita Intervento: cambio stato in sezione espandibile
  - Card onPress per sezioni espandibili (fix event handling)
- 2025-11-26: Bug fix foto e notifiche
  - PhotoPicker usa ImagePicker.MediaTypeOptions.Images
  - Gestione errori migliorata

## Development Notes
- Hot Module Reloading attivo per modifiche codice
- Bundle statico per Expo Go via deep linking
- Demo mode in AuthContext per testing senza backend
- Account demo disponibili per tutti i ruoli (master, ditta, tecnico)
- Web version disponibile su porta 8081
- Test con Expo Go su device fisico via QR code
