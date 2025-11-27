# SolarTech - App Tecnici Fotovoltaici

## Overview
Applicazione mobile cross-platform (Android e iOS) per tecnici installatori di impianti fotovoltaici. Gestisce il workflow completo: assegnazione interventi da admin, programmazione appuntamenti, documentazione sul campo con foto/note e GPS, completamento e generazione report.

## Role-Based Access System (3 Tier)
- **MASTER (GBD Amministratore)**: Crea e gestisce tutte le ditte e tecnici, vede TUTTI gli interventi
- **DITTA INSTALLATRICE**: Gestisce i propri tecnici, vede tutti gli interventi della propria azienda, può chiudere definitivamente interventi e inviare email
- **TECNICO**: Vede interventi assegnati a lui + interventi della sua ditta non ancora assegnati, lavoro sul campo, documentazione foto/note, GPS

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
│   ├── DashboardScreen.tsx          # Home con statistiche (globali per MASTER)
│   ├── CalendarScreen.tsx           # Calendario appuntamenti
│   ├── InterventionsListScreen.tsx  # Lista interventi attivi
│   ├── InterventionDetailScreen.tsx # Dettaglio con 5 sezioni
│   ├── CompletedInterventionsScreen.tsx # Archivio completati
│   ├── ProfileScreen.tsx            # Profilo utente e logout
│   ├── ManageCompaniesScreen.tsx    # Gestione ditte (MASTER only)
│   ├── ManageUsersScreen.tsx        # Gestione utenti (MASTER only)
│   ├── CreateInterventionScreen.tsx # Creazione interventi (MASTER only)
│   ├── CompanyInterventionsScreen.tsx # Lista interventi per ditta
│   └── BulkAssignScreen.tsx         # Assegnazione multipla interventi
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
5. **chiuso** - Intervento chiuso definitivamente dalla ditta

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
- 2025-11-26: Implementate funzionalità MASTER complete
  - AppContext esteso con gestione ditte, utenti e statistiche globali
  - DashboardScreen mostra "Panoramica Globale" per MASTER:
    - Contatori totali (interventi, ditte, tecnici)
    - Interventi suddivisi per ditta (cliccabili per vedere dettagli)
    - Sezione "Interventi Non Assegnati" con badge conteggio
    - FAB (pulsante flottante) per creare nuovi interventi
  - CompanyInterventionsScreen: lista interventi filtrata per ditta
    - Header con icona ditta e conteggio totale
    - Sezioni separate per interventi attivi e completati
    - Click su intervento apre dettaglio
  - ProfileScreen con sezione "Gestione Sistema" per MASTER:
    - Gestione Ditte (ManageCompaniesScreen)
    - Gestione Utenti (ManageUsersScreen)
    - Nuovo Intervento (CreateInterventionScreen)
  - ManageCompaniesScreen: CRUD ditte con form validato
  - ManageUsersScreen: CRUD utenti con selezione ruolo e ditta
  - CreateInterventionScreen: form completo con assegnazione ditta OPZIONALE
    - Opzione "Non assegnare (intervento libero)" per creare senza ditta
    - Gli interventi non assegnati appaiono in Dashboard
  - BulkAssignScreen: assegnazione multipla interventi
    - Selezione multipla interventi non assegnati
    - Pulsanti "Seleziona tutti" e "Deseleziona"
    - Assegnazione in blocco a ditta selezionata
  - Filtro interventi role-based: MASTER vede tutto, DITTA vede propri, TECNICO vede assegnati + liberi
  - Aggiunto stato "chiuso" per interventi chiusi definitivamente
- 2025-11-26: Fix navigazione card statistiche Dashboard
  - Card "Nuovi" naviga a lista filtrata per status 'assegnato'
  - Card "Programmati" naviga a lista filtrata per status 'appuntamento_fissato'
  - Card "In corso" naviga a lista filtrata per status 'in_corso'
  - Card "Completati" naviga a tab separato CompletedTab
  - InterventionsListScreen ora accetta parametro filterStatus da route
- 2025-11-27: Implementate funzionalità DITTA complete
  - CompanyAccountScreen: pagina account ditta
    - Visualizza profilo azienda (nome, indirizzo, telefono, email)
    - Statistiche interventi per stato (nuovi, programmati, in corso, completati, chiusi)
    - Lista tecnici con badge conteggio interventi attivi
    - Pulsanti azione: "Chiudi Interventi Completati", "Report Mensile"
  - CloseInterventionsScreen: chiusura definitiva interventi
    - Lista interventi con status 'completato' pronti per la chiusura
    - Selezione singola/multipla con checkbox
    - Campo email per invio report
    - Cambio stato a 'chiuso' con metadata (closedAt, closedBy, emailSentTo)
  - ProfileScreen con sezione "Gestione Ditta" per ruolo DITTA:
    - Accesso a Account Ditta dalla pagina Profilo
  - Intervention type esteso con campi chiusura: closedAt, closedBy, emailSentTo
  - 3 interventi non assegnati per testing assegnazione bulk
- 2025-11-27: Implementato GPS tracking tecnici (MASTER only)
  - TechnicianMapScreen: mappa interattiva con posizione tecnici
    - Su mobile: MapView con marker colorati (verde online, grigio offline)
    - Su web: lista fallback con card tecnici e posizione
    - Callout con info tecnico, ditta e ultimo aggiornamento
    - Card dettaglio con pulsanti Chiama/Messaggio
    - Legenda online/offline con conteggio
  - User type esteso con campo lastLocation (latitude, longitude, address, timestamp, isOnline)
  - Dashboard MASTER: pulsante "Mappa Tecnici" per navigare alla mappa
  - Demo data con 3 tecnici in citta italiane (Milano, Torino, Roma)
  - Navigazione DashboardStackNavigator aggiornata
  - Tutti i colori usano theme Colors constants
- 2025-11-27: Implementato invio report email per DITTA
  - SendReportModal: modale per invio report interventi completati
    - Destinatario fisso: operation.gbd@gruppo-phoenix.com
    - Riepilogo intervento: numero, cliente, foto, GPS, note
    - Campo note extra opzionale per aggiungere commenti dalla ditta
    - Usa expo-mail-composer per aprire l'app email nativa
    - Su web: apre il gestore email del browser (mailto)
    - Email formattata con tutti i dati intervento, cliente, tecnico, GPS, foto
  - CompletedInterventionsScreen aggiornato:
    - Pulsante "Invia Report a GBD" visibile solo per utenti DITTA
    - Badge "Report inviato" per interventi già inviati (emailSentTo valorizzato)
  - Button component esteso con prop variant: 'primary' | 'secondary' | 'danger'
  - Nuovo componente: components/SendReportModal.tsx
- 2025-11-27: Implementato sistema creazione credenziali
  - AuthContext esteso con funzione registerUser per registrazione utenti demo
    - Salvataggio credenziali in AsyncStorage (solo per demo mode)
    - Verifica duplicati username
    - Password minimo 6 caratteri
  - ManageCompaniesScreen: MASTER crea ditte con credenziali
    - Sezione "Credenziali Account Ditta" con username/password
    - Toggle visibilità password
    - Rollback ditta se registrazione fallisce
    - Alert con riepilogo credenziali create
  - ManageUsersScreen: MASTER crea utenti con credenziali
    - Sezione "Credenziali Accesso" nel form
    - Toggle visibilità password
    - Alert con riepilogo credenziali create
  - ManageTechniciansScreen: DITTA crea tecnici propri
    - Nuova schermata per gestione tecnici della ditta
    - Form con username/password
    - Lista tecnici della propria ditta
    - Navigazione da ProfileScreen per ruolo DITTA
  - ProfileScreen aggiornato:
    - Sezione "Gestione Ditta" per DITTA mostra "Gestione Tecnici"
  - ProfileStackNavigator: aggiunta route ManageTechnicians

## Development Notes
- Hot Module Reloading attivo per modifiche codice
- Bundle statico per Expo Go via deep linking
- Demo mode in AuthContext per testing senza backend
- Account demo disponibili per tutti i ruoli (master, ditta, tecnico)
- Web version disponibile su porta 8081
- Test con Expo Go su device fisico via QR code
