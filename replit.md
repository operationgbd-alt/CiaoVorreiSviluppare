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
    - **Reporting**: Server-side PDF report generation using Puppeteer with HTML templates. Reports are role-restricted (MASTER/DITTA only) with SQL-level tenant isolation. Email integration via expo-mail-composer to operation.gbd@gruppo-phoenix.com.
    - **Real-time Tracking**: TechnicianMapScreen (MASTER only) displays technician locations with online/offline status.
    - **Credential Management**: System for creating and managing user and company credentials.
    - **Role-based field data acquisition**: Only TECNICO can acquire GPS, take/upload photos, modify notes, and change status; DITTA and MASTER have read-only access.

## Photo Storage System
- **Server-side Storage**: Photos are stored in PostgreSQL as base64 data, enabling cross-device visibility
- **API Endpoints**:
  - POST /api/photos - Upload photo with base64 data
  - GET /api/photos/:id/image - Retrieve photo as image
  - GET /api/photos/intervention/:id - List all photos for an intervention
  - DELETE /api/photos/:id - Delete a photo
- **Visual Indicators**: Server photos show a cloud icon, local photos show a device icon
- **Fallback**: If server upload fails, photos are saved locally on the device

## PDF Report System
- **Server-side Generation**: PDF reports created using Puppeteer with HTML templates and Nix Chromium
- **API Endpoints**:
  - POST /api/reports/intervention/:id - Generate PDF report for an intervention
  - Accepts `interventionData` in request body for demo/local interventions
  - Accepts `demoUser` in request body for authentication fallback
- **Security**:
  - Role check: Only MASTER and DITTA users can generate reports (case-insensitive)
  - Tenant isolation: DITTA users can only access reports for their own company's interventions
  - SQL-level filtering: Company filter applied directly in database queries (not post-fetch)
  - No information disclosure: Unauthorized requests return 404 (not 403) to prevent ID probing
  - Demo user authentication: Accepts user data from request body when no JWT token present
- **Report Content**: Company info, intervention details, technician data, photos, GPS coordinates, notes
- **Email Integration**: Reports can be sent via expo-mail-composer to operation.gbd@gruppo-phoenix.com
- **Technical Note**: Uses Nix Chromium (/nix/store/.../bin/chromium) for PDF generation due to Replit environment constraints

## External Dependencies
- **PostgreSQL**: Database for persistent data storage, including photo storage.
- **Express.js**: Backend framework for API services.
- **JWT (JSON Web Tokens)**: For user authentication and authorization.
- **bcrypt**: For password hashing.
- **expo-location**: For accessing device GPS capabilities.
- **expo-image-picker**: For accessing device camera and photo gallery.
- **expo-file-system**: For converting photos to base64 for server upload.
- **expo-mail-composer**: For composing and sending emails.

## Production Deployment

### Backend (Railway)
- **URL**: `https://api-backend-production-c189.up.railway.app`
- **Health Check**: `https://api-backend-production-c189.up.railway.app/api/health`
- **Database**: PostgreSQL on Railway (auto-configured)
- **Environment Variables**: DATABASE_URL, JWT_SECRET, NODE_ENV=production

### Mobile App (EAS Build)
- **Configuration**: `eas.json` with production profile pointing to Railway backend
- **Android APK**: Generated via `eas build --platform android --profile production`
- **iOS IPA**: Requires Apple Developer account ($99/year)

### Build Instructions
See `BUILD_APK.md` for detailed instructions on generating APK/IPA files.