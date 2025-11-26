# SolarTech - App Tecnici Fotovoltaici

## Overview
Applicazione mobile cross-platform (Android e iOS) per tecnici installatori di impianti fotovoltaici. Gestisce il workflow completo: assegnazione interventi da admin, programmazione appuntamenti, documentazione sul campo con foto/note e GPS, completamento e generazione report.

## Project Architecture

### Stack
- **Framework**: Expo SDK 54 con React Native
- **Navigation**: React Navigation 7 con tab navigator
- **State Management**: React Context API (in-memory con mock data)
- **Styling**: React Native StyleSheet con design system personalizzato
- **Location**: expo-location per tracciamento GPS
- **Media**: expo-image-picker per foto documentazione

### Directory Structure
```
├── App.tsx                 # Entry point con providers
├── app.json               # Configurazione Expo
├── constants/
│   └── theme.ts           # Colori, spacing, typography
├── types/
│   └── index.ts           # TypeScript types per Intervention, Appointment, etc.
├── store/
│   └── AppContext.tsx     # Stato globale con dati interventi e appuntamenti
├── navigation/
│   ├── MainTabNavigator.tsx           # Tab navigator (3 tab: Dashboard, Interventi, Profilo)
│   ├── DashboardStackNavigator.tsx
│   ├── InterventionsStackNavigator.tsx # Stack per workflow interventi
│   └── ProfileStackNavigator.tsx
├── screens/
│   ├── DashboardScreen.tsx              # Home con statistiche e attività recenti
│   ├── CalendarScreen.tsx               # Calendario appuntamenti
│   ├── AppointmentFormScreen.tsx        # Form appuntamento
│   ├── InterventionsListScreen.tsx      # Lista interventi con filtri per stato
│   ├── InterventionDetailScreen.tsx     # Dettaglio intervento con azioni workflow
│   ├── ScheduleAppointmentScreen.tsx    # Modal per fissare appuntamento
│   ├── InterventionDocumentationScreen.tsx # Documentazione foto/note
│   └── ProfileScreen.tsx                # Profilo tecnico e impostazioni
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
- installazione
- manutenzione
- riparazione
- sopralluogo
- assistenza

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
2. **Lista Interventi** - Filtri per stato, ordinamento priorità/data, cards dettagliate
3. **Dettaglio Intervento** - Info cliente, contatti rapidi (chiama/email/naviga), workflow actions
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
- 2025-11-26: Refactoring completo modello dati
  - Sostituito sistema separato Survey/Installation con modello Intervention unificato
  - Nuovo workflow: assegnato -> appuntamento -> in corso -> completato
  - Aggiunto tracciamento GPS all'avvio intervento
  - Nuova schermata dettaglio con azioni workflow dinamiche
  - Filtri interventi per stato
  - Dashboard aggiornata con statistiche interventi
  - Tab navigation ridotta a 3 tab (Dashboard, Interventi, Profilo)
- 2025-11-26: Bug fix foto e notifiche
  - PhotoPicker usa ImagePicker.MediaTypeOptions.Images
  - Gestione errori migliorata

## Development Notes
- Hot Module Reloading attivo per modifiche codice
- Bundle statico per Expo Go via deep linking
- Dati mock in AppContext per prototipazione (5 interventi demo)
- Web version disponibile su porta 8081
- Test con Expo Go su device fisico via QR code
