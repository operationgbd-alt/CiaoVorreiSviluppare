# SolarTech - App Tecnici Fotovoltaici

## Overview
SolarTech is a cross-platform mobile application (Android and iOS) designed for photovoltaic system installation technicians. It manages the entire workflow, from assignment of interventions by administrators to appointment scheduling, on-site documentation (photos, notes, GPS), completion, and report generation. The application features a robust role-based access system (Master, Ditta Installatrice, Tecnico) to ensure secure and appropriate access levels, enhancing efficiency and coordination for solar energy installation companies.

## User Preferences
- Lingua: Italiano
- Interfaccia ottimizzata per uso sul campo con pulsanti grandi
- Workflow unificato per tutti i tipi di intervento
- Freccia "torna indietro" sempre visibile in tutte le pagine di navigazione

## System Architecture

### Stack
- **Framework**: Expo SDK 54 with React Native
- **Backend**: Express.js with PostgreSQL (pg driver)
- **Auth**: JWT with bcrypt for password hashing
- **Navigation**: React Navigation 7 with tab navigator
- **State Management**: React Context API (AuthContext + AppContext)
- **Styling**: React Native StyleSheet with a custom design system
- **Location**: expo-location for GPS tracking
- **Media**: expo-image-picker for photo documentation

### Core Features
- **Role-Based Access System**:
    - **MASTER**: Manages all companies and technicians, views all interventions.
    - **DITTA INSTALLATRICE**: Manages its own technicians, views all company interventions, can definitively close interventions and send emails.
    - **TECNICO**: Views assigned interventions + unassigned interventions from their company, performs field work, photo/note documentation, GPS tracking.
- **Intervention Workflow**: States include `assegnato`, `appuntamento_fissato`, `in_corso`, `completato`, and `chiuso`. Interventions have priorities (low, normal, high, urgent) and categories (sopralluogo, installazione, manutenzione).
- **UI/UX Design**: Uses a custom design system with defined colors (Primary: #0066CC, Secondary: #FF9500, Success: #34C759, Danger: #FF3B30, Purple: #5856D6) and typography for a professional and intuitive interface.
- **Technical Implementations**:
    - **Dashboard**: Provides statistics, daily appointments, and recent activities, with global overview for MASTER users.
    - **Intervention Management**: Features a list of interventions categorized by type, detailed intervention screens with sections for client info, calendar, management (photos, GPS, notes), and status updates.
    - **Appointment Scheduling**: Date picker and notes for customer appointments.
    - **GPS Acquisition**: Records technician location when starting an intervention.
    - **Documentation**: Captures photos and notes for work performed.
    - **User and Company Management**: MASTER users can perform CRUD operations on companies and users, including bulk assignment of interventions. DITTA users can manage their own technicians.
    - **Reporting**: Automated PDF report generation (planned), email sending of reports, and digital client signature (planned).
    - **Real-time Tracking**: TechnicianMapScreen (MASTER only) displays technician locations with online/offline status.
    - **Credential Management**: System for creating and managing user and company credentials.
    - **Role-based field data acquisition**: Only TECNICO can acquire GPS, take/upload photos, modify notes, and change status; DITTA and MASTER have read-only access.

## External Dependencies
- **PostgreSQL**: Database for persistent data storage.
- **Express.js**: Backend framework for API services.
- **JWT (JSON Web Tokens)**: For user authentication and authorization.
- **bcrypt**: For password hashing.
- **expo-location**: For accessing device GPS capabilities.
- **expo-image-picker**: For accessing device camera and photo gallery.
- **expo-mail-composer**: For composing and sending emails.