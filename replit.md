# SolarTech - App Tecnici Fotovoltaici

## Overview
Applicazione mobile cross-platform (Android e iOS) per tecnici installatori di impianti fotovoltaici. Permette di gestire sopralluoghi, ordini di lavoro (ODL), appuntamenti e calendario.

## Project Architecture

### Stack
- **Framework**: Expo SDK 54 con React Native
- **Navigation**: React Navigation 7 con tab navigator
- **State Management**: React Context API (in-memory)
- **Styling**: React Native StyleSheet con design system personalizzato

### Directory Structure
```
├── App.tsx                 # Entry point con providers
├── app.json               # Configurazione Expo
├── constants/
│   └── theme.ts           # Colori, spacing, typography
├── types/
│   └── index.ts           # TypeScript types per Survey, Installation, etc.
├── store/
│   └── AppContext.tsx     # Stato globale dell'app con mock data
├── navigation/
│   ├── MainTabNavigator.tsx      # Tab navigator principale
│   ├── DashboardStackNavigator.tsx
│   ├── SurveysStackNavigator.tsx
│   ├── InstallationsStackNavigator.tsx
│   └── ProfileStackNavigator.tsx
├── screens/
│   ├── DashboardScreen.tsx       # Home con statistiche e attività
│   ├── CalendarScreen.tsx        # Calendario appuntamenti
│   ├── AppointmentFormScreen.tsx # Form appuntamento
│   ├── SurveysListScreen.tsx     # Lista sopralluoghi
│   ├── SurveyFormScreen.tsx      # Form sopralluogo (checklist A1, A2)
│   ├── InstallationsListScreen.tsx # Lista ODL
│   ├── InstallationFormScreen.tsx  # Form ODL
│   └── ProfileScreen.tsx         # Profilo e impostazioni
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── HeaderTitle.tsx
│   ├── ScreenScrollView.tsx
│   ├── ScreenKeyboardAwareScrollView.tsx
│   ├── ScreenFlatList.tsx
│   ├── Spacer.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
└── assets/
    └── images/
        └── icon.png          # App icon
```

## Features

### Implemented (MVP)
1. **Dashboard** - Panoramica con appuntamenti del giorno e attività recenti
2. **Sopralluoghi** - Lista con filtri e form digitale basato sulla checklist PDF
3. **Installazioni (ODL)** - Lista ordini di lavoro con form completo
4. **Calendario** - Visualizzazione mensile con dettagli appuntamenti
5. **Profilo** - Dati tecnico e impostazioni app

### Planned (Next Phase)
- Sincronizzazione cloud con API backend
- Generazione PDF automatica
- Firma digitale cliente
- Tracciamento GPS cantieri
- Notifiche push reali

## Design System

### Colors
- **Primary**: #0066CC (blu professionale)
- **Secondary**: #FF9500 (arancione warning)
- **Success**: #34C759
- **Danger**: #FF3B30

### Typography
- H1: 28pt Bold
- H2: 22pt Semibold
- H3: 18pt Semibold
- Body: 16pt Regular
- Caption: 12pt Regular

## User Preferences
- Lingua: Italiano
- Interfaccia ottimizzata per uso sul campo con pulsanti grandi
- Form basati sui moduli PDF esistenti (Checklist Installatore, ODL)

## Recent Changes
- 2025-11-26: Corretti bug critici nelle funzionalità foto e notifiche
  - PhotoPicker ora usa correttamente ImagePicker.MediaTypeOptions.Images
  - Notifiche appuntamenti con ID stabili, cancellazione/riprogrammazione su modifica/elimina
  - Aggiunto feedback aptico ai pulsanti (solo dispositivi nativi)
  - Gestione errori migliorata per foto e notifiche
- 2024-11: Creazione prototipo MVP con tutte le schermate principali
- Implementata navigazione a 4 tab (Dashboard, Sopralluoghi, Installazioni, Profilo)
- Digitalizzati i form checklist A1, A2 e ODL
- Aggiunto calendario con visualizzazione mensile

## Development Notes
- Hot Module Reloading attivo per modifiche codice
- Bundle statico per Expo Go via deep linking
- Dati mock in AppContext per prototipazione
