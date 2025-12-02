# SolarTech - Checklist Pre-Build OBBLIGATORIA

**REGOLA: Questa checklist DEVE essere completata PRIMA di ogni build EAS (APK/IPA)**

---

## 1. Verifica Ambiente

- [ ] Backend Railway attivo: `https://solartech-backend-production.up.railway.app/api/health`
- [ ] EXPO_TOKEN configurato
- [ ] API_URL in eas.json punta a Railway production
- [ ] Nessun errore LSP critico nei file principali

## 2. Verifica API (curl/Postman)

```bash
# Health check
curl https://solartech-backend-production.up.railway.app/api/health

# Login test
curl -X POST https://solartech-backend-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"gbd","password":"password"}'

# Interventions (con token)
curl https://solartech-backend-production.up.railway.app/api/interventions \
  -H "Authorization: Bearer <TOKEN>"
```

- [ ] /api/health → 200 OK
- [ ] /api/auth/login → 200 + token JWT
- [ ] /api/interventions → 200 + array interventi
- [ ] /api/users → 200 + lista utenti
- [ ] /api/companies → 200 + lista aziende

## 3. Test per Ruolo

### MASTER (gbd/password)
- [ ] Login funziona
- [ ] Dashboard mostra statistiche globali
- [ ] Pulsante sync manuale (FAB) funziona
- [ ] Mappa Tecnici si apre SENZA crash
- [ ] Markers tecnici visibili (se hanno GPS)
- [ ] Lista interventi completa
- [ ] Può eliminare interventi
- [ ] Gestione utenti accessibile
- [ ] Gestione aziende accessibile

### DITTA (ditta/password)
- [ ] Login funziona
- [ ] Dashboard mostra solo dati azienda
- [ ] NON vede interventi altre aziende
- [ ] Può assegnare tecnici
- [ ] Può fissare appuntamenti
- [ ] Può generare PDF
- [ ] NON può eliminare interventi

### TECNICO (alex/password)
- [ ] Login funziona
- [ ] Vede solo interventi assegnati + non assegnati azienda
- [ ] Può avviare intervento (acquisisce GPS)
- [ ] Può aggiungere foto
- [ ] Può modificare note
- [ ] Può cambiare stato
- [ ] NON può eliminare interventi

## 4. Funzionalità Critiche

### Mappa Tecnici (MASTER only)
- [ ] Schermata si apre senza crash
- [ ] Tecnici con GPS mostrano marker
- [ ] Tecnici senza GPS in lista separata
- [ ] Badge online/offline corretto
- [ ] Pulsante "Centra" funziona
- [ ] Pulsante "Chiama" funziona

### Interventi
- [ ] Lista carica correttamente
- [ ] Filtri funzionano (tipo, stato, priorità)
- [ ] Ricerca funziona
- [ ] Dettaglio intervento si apre
- [ ] Transizioni stato corrette
- [ ] Foto visibili (se presenti)
- [ ] GPS registrato correttamente

### Report PDF
- [ ] Generazione PDF funziona
- [ ] Email composer si apre
- [ ] Allegato PDF presente

## 5. Controlli Codice

```bash
# Verifica errori TypeScript
npx tsc --noEmit

# Verifica LSP diagnostics sui file critici
```

- [ ] Nessun errore TypeScript critico
- [ ] TechnicianMapScreen.tsx: 0 errori
- [ ] TechnicianMap.tsx: 0 errori
- [ ] InterventionsListScreen.tsx: 0 errori
- [ ] InterventionDetailScreen.tsx: 0 errori
- [ ] AppContext.tsx: 0 errori

## 6. Test Web (Playwright)

Eseguire test automatizzati per:
- [ ] Login MASTER
- [ ] Navigazione Dashboard
- [ ] Lista Interventi
- [ ] Apertura Mappa Tecnici (web fallback)

---

## Risultato

**Data Test:** _______________
**Eseguito da:** Agent
**Build ID:** _______________

| Area | Stato |
|------|-------|
| API Backend | ⬜ OK / ⬜ FAIL |
| Login Ruoli | ⬜ OK / ⬜ FAIL |
| Mappa Tecnici | ⬜ OK / ⬜ FAIL |
| Interventi | ⬜ OK / ⬜ FAIL |
| Report PDF | ⬜ OK / ⬜ FAIL |
| Codice | ⬜ OK / ⬜ FAIL |

**APPROVATO PER BUILD:** ⬜ SI / ⬜ NO

---

## Note Importanti

1. **Mai fare build se un test fallisce** - correggere prima
2. **La build precedente ha avuto problemi con:**
   - TechnicianMap crash (coordinate non valide)
   - tech.name.split() su undefined
3. **Dopo ogni build, testare su dispositivo fisico**
