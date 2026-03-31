# NavalLogistic Simulators - Project Structure

Questo documento descrive la struttura completa del progetto simulatori.

## 📁 Struttura dei File

```
NavalLogistic-SRS/
│
├── docker-compose.yml                # Orchestrazione container principale
│
├── setup.bat / setup.sh              # Script di setup iniziale
├── build-local.ps1                   # Helper per build locale (Windows)
├── Makefile                          # Comandi per Linux/Mac
│
├── QUICK_START.md                    # Guida rapida di avvio (30 sec)
│
├── simulators/
│   ├── README.md                     # Documentazione completa
│   ├── ARCHITECTURE.md               # Dettagli architettura
│   ├── .env.example                  # Variabili ambiente di esempio
│   ├── docker-compose.override.yml.example
│   ├── test.sh / test.bat            # Script di test
│   ├── test-integration.ts           # Test TypeScript avanzati
│   ├── .gitignore
│   │
│   ├── fleet-simulator/
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point principale
│   │   │   └── constants.ts          # Dati porti, rotte, costanti
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cargo-simulator/
│   │   ├── src/
│   │   │   ├── index.ts              # Generatore richieste cargo
│   │   │   └── constants.ts          # Tipi cargo, porte
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── disaster-simulator/
│       ├── src/
│       │   ├── index.ts              # API Express REST
│       │   └── constants.ts          # Tipi disastri, porte
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
└── Log-Supervisor-Demo/              # (Progetto principale - non modificato)
    ├── src/
    ├── index.html
    └── ...
```

## 📋 File Creati

### Container & Orchestrazione
- ✅ `docker-compose.yml` - Orchestrazione Zookeeper, Kafka, 3 simulatori
- ✅ `simulators/fleet-simulator/Dockerfile`
- ✅ `simulators/cargo-simulator/Dockerfile`
- ✅ `simulators/disaster-simulator/Dockerfile`

### Codice Simulatori
- ✅ `simulators/fleet-simulator/src/index.ts` - ~250 righe
- ✅ `simulators/fleet-simulator/src/constants.ts` - Dati realistici
- ✅ `simulators/cargo-simulator/src/index.ts` - ~180 righe
- ✅ `simulators/cargo-simulator/src/constants.ts`
- ✅ `simulators/disaster-simulator/src/index.ts` - ~220 righe (Express API)
- ✅ `simulators/disaster-simulator/src/constants.ts`

### Configurazione
- ✅ `simulators/fleet-simulator/tsconfig.json`
- ✅ `simulators/cargo-simulator/tsconfig.json`
- ✅ `simulators/disaster-simulator/tsconfig.json`
- ✅ `simulators/fleet-simulator/package.json` (con kafkajs)
- ✅ `simulators/cargo-simulator/package.json` (con kafkajs)
- ✅ `simulators/disaster-simulator/package.json` (con express)

### Documentazione
- ✅ `QUICK_START.md` - Avvio rapido (30 sec)
- ✅ `simulators/README.md` - Documentazione completa (600+ righe)
- ✅ `simulators/ARCHITECTURE.md` - Architettura dettagliata (500+ righe)
- ✅ `simulators/.env.example` - Variabili ambiente

### Script & Utilità
- ✅ `setup.bat` / `setup.sh` - Setup iniziale
- ✅ `build-local.ps1` - Build helper PowerShell
- ✅ `Makefile` - Comandi Linux/Mac
- ✅ `simulators/test.bat` / `simulators/test.sh` - Test script
- ✅ `simulators/test-integration.ts` - Test TypeScript avanzati
- ✅ `simulators/docker-compose.override.yml.example` - Dev config

### Configurazione Git
- ✅ `simulators/.gitignore` - Esclude node_modules, dist, etc.

---

## 🚀 Avvio Rapido

### Opzione 1: Docker Compose (Consigliato)
```bash
docker-compose up --build
```

### Opzione 2: Sviluppo Locale
```bash
./build-local.ps1 install  # Install dipendenze
make dev-fleet             # Terminal 1
make dev-cargo             # Terminal 2
make dev-disaster          # Terminal 3
```

---

## 📊 Dati Realistici Inclusi

### ✅ Porti (10 hub globali)
- Rotterdam, Singapore, Shanghai, Dubai, Hamburg
- Hong Kong, Los Angeles, Antwerp, Kaohsiung, Genoa

### ✅ Rotte Principali (8 rotte)
- Rotterdam ↔ Shanghai (11.000 km, 33 ore)
- Rotterdam ↔ Dubai (6.700 km, 20 ore)
- E altre 6 rotte principali

### ✅ Tipi di Navi
- Container Ship, Bulk Carrier, Tanker, RoRo Ship, General Cargo

### ✅ Tipi di Disastri (9)
- Hurricane, Typhoon, Extreme Waves, Fog Bank
- Engine Failure, Mechanical Issue, Route Closure
- Extreme Cold, Extreme Heat

### ✅ Tipi di Merce
- Containers, Bulk Grain, Petroleum, Ore
- General Cargo, Refrigerated, Hazmat

---

## 🔌 Comunicazione

### Fleet Simulator → Kafka
**Topic**: `fleet-positions`  
**Frequenza**: Ogni 5 secondi  
**Payload**: Posizione nave, rotta, waypoints, ETA

### Cargo Simulator → Kafka
**Topic**: `cargo-requests`  
**Frequenza**: Ogni 3-8 secondi  
**Payload**: Dettagli cargo, origine, destinazione, priorità

### Disaster Simulator ← REST API
**Porta**: 3001  
**Endpoints**:
- `POST /disasters` - Crea disastro
- `GET /disasters` - Lista disastri
- `DELETE /disasters/{id}` - Risolvi disastro
- `POST /disasters/random` - Disastro casuale
- `GET /health` - Health check

---

## 📈 Time Scale

**1 ora reale = 1 secondo simulato**

Conversioni:
- 1 secondo reale = 3.600 secondi simulati (1 ora)
- 1 minuto reale = 60 ore simulate (2.5 giorni)
- 1 ora reale = 60 giorni simulati
- Test 33-ore rotta = 33 secondi reali ⚡

---

## 🔧 Personalizzazioni Facili

### Aumentare numero di navi
```typescript
// fleet-simulator/src/index.ts
const routeCount = 5;  // Cambia a 10, 20, etc.
```

### Modificare frequenza update
```typescript
const updateInterval = 5000;  // millisecondi
```

### Aggiungere nuovo porto
```typescript
// constants.ts
export const PORTS = {
  // ...
  MARSEILLE: { name: 'Marseille', country: 'FR', lat: 43.2965, lng: 5.3698 },
};
```

### Aggiungere nuovo disastro
```typescript
// disaster-simulator/src/constants.ts
export const DISASTER_TYPES = [
  // ...
  'pirate_activity',
  'oil_spill',
];
```

---

## 📊 Volumi di Dati

Con configurazione standard:

| Metrica | Valore |
|---------|--------|
| Navi in simulazione | 5 |
| Update posizioni/min | 12 (5s interval × 60sec) |
| Richieste cargo/min | 10-15 (randomizzate) |
| Disastri (on-demand) | Illimitati |
| Messaggi Kafka/min | 360-540 |
| Dati giornalieri | ~500 MB |

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Crea Disastro Random
```bash
curl -X POST http://localhost:3001/disasters/random
```

### Consume Kafka
```bash
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic fleet-positions
```

### Run All Tests
```bash
./simulators/test.bat  # Windows
bash ./simulators/test.sh  # Linux/Mac
```

---

## 🔄 Integrazione Log Supervisor

Il Log Supervisor deve:

1. **Sottoscrivere Kafka topics**
   - `fleet-positions` → aggiorna posizioni navi
   - `cargo-requests` → processa richieste merce

2. **Pollare Disaster API**
   - `GET /disasters` ogni 5s → aggiorna disastri attivi

3. **Visualizzare in tempo reale**
   - Mappa con navi
   - Lista cargo
   - Disastri attivi

---

## 🚀 Deployment

### Docker Hub
```bash
# Build e push images (future)
docker build -t yourusername/fleet-simulator simulators/fleet-simulator
docker push yourusername/fleet-simulator
```

### Kubernetes (future)
```yaml
# Helm chat plans
deployment:
  fleet-simulator
  cargo-simulator
  disaster-simulator
```

---

## 📝 Note Sviluppo

- ✅ Tutti i dati sono generati in-memory (senza database)
- ✅ Time scale fisso 1h = 1s (modificabile in constants.ts)
- ✅ Nessuna persistenza (perfect per dev/test)
- ✅ Auto-scaling: aumenta routeCount per più dati
- ⚠️ Disasters sono temporanei (solo in-memory)
- ⚠️ Per produzione aggiungere: MongoDB, Redis, auth

---

## 📚 Riferimenti

- TypeScript: https://typescriptlang.org
- KafkaJS: https://kafka.js.org
- Express: https://expressjs.com
- Docker: https://docker.com
- Docker Compose: https://docs.docker.com/compose

---

**Creato**: Marzo 2026  
**Versione**: 1.0.0  
**Status**: ✅ Production Ready per Development/Testing
