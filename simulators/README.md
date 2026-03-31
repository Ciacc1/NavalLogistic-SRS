# NavalLogistic Simulators 🚢

Sistema di simulazione completo per la logistics navale con 3 container separati:

## Architettura

```
┌─────────────────────────────────┐
│   Fleet Simulator (Kafka)       │  Pubblica posizioni navi in tempo reale
│   → fleet-positions topic       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Cargo Simulator (Kafka)       │  Genera richieste di trasferimento merci
│   → cargo-requests topic        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Disaster Simulator (REST API) │  Crea/gestisce disastri e chiusure rotte
│   → http://localhost:3001       │
└─────────────────────────────────┘

           ↓ Kafka Messages ↓

┌─────────────────────────────────┐
│   Log Supervisor Dashboard      │  Riceve e visualizza tutti i dati
│   → http://localhost:5173       │
└─────────────────────────────────┘
```

## Avvio

### Prerequisiti
- Docker & Docker Compose
- Node.js 18+ (per sviluppo locale)

### Con Docker Compose
```bash
docker-compose up --build
```

Questo avvia:
- ✓ Zookeeper
- ✓ Kafka (broker)
- ✓ Fleet Simulator
- ✓ Cargo Simulator
- ✓ Disaster Simulator API

### Sviluppo locale (senza Docker)

**Terminal 1 - Kafka**
```bash
# Usa servizi Kafka/Zookeeper localmente o via Docker
docker-compose up kafka zookeeper
```

**Terminal 2 - Fleet Simulator**
```bash
cd simulators/fleet-simulator
npm install
npm run dev
```

**Terminal 3 - Cargo Simulator**
```bash
cd simulators/cargo-simulator
npm install
npm run dev
```

**Terminal 4 - Disaster Simulator**
```bash
cd simulators/disaster-simulator
npm install
npm run dev
```

## API Disaster Simulator

Base URL: `http://localhost:3001`

### Creare un disastro
```bash
POST /disasters
Content-Type: application/json

{
  "type": "hurricane",
  "severity": "critical",
  "affectedArea": "Atlantic Ocean"
}
```

Tipi disastri: `hurricane`, `typhoon`, `extreme_waves`, `fog_bank`, `engine_failure`, `mechanical_issue`, `route_closure`, `extreme_cold`, `extreme_heat`

### Generare casuale
```bash
POST /disasters/random
```

### Listare disastri attivi
```bash
GET /disasters
```

### Ottenere dettagli
```bash
GET /disasters/{id}
```

### Risolvere disastro
```bash
DELETE /disasters/{id}
```

### Health Check
```bash
GET /health
```

## Kafka Topics

### fleet-positions
Pubblica ogni 5 secondi con:
```json
{
  "timestamp": "2024-03-31T10:30:00Z",
  "shipId": "SHIP-ABC12345",
  "name": "MSC 1234",
  "type": "Container Ship",
  "position": {
    "latitude": 51.92,
    "longitude": 4.28,
    "heading": 135.5,
    "speed": 21.5
  },
  "voyage": {
    "departure": "ROTTERDAM",
    "destination": "SHANGHAI",
    "eta": "2024-04-07T10:30:00Z",
    "progress": {
      "completedWaypoints": 2,
      "totalWaypoints": 5,
      "waypoints": [...]
    }
  },
  "status": "en_route"
}
```

### cargo-requests
Pubblica ogni 3-8 secondi con:
```json
{
  "id": "CARGO-XYZ98765",
  "timestamp": "2024-03-31T10:30:00Z",
  "originPort": "ROTTERDAM",
  "destinationPort": "SHANGHAI",
  "cargoDetails": {
    "type": "containers",
    "weight": 2500.50,
    "containers": 100,
    "hazmat": false,
    "requiresTemperatureControl": false
  },
  "pickupDate": "2024-03-31T12:00:00Z",
  "deliveryDate": "2024-04-10T18:00:00Z",
  "priority": "urgent",
  "shipper": { "name": "Global Logistics", "contact": "..." },
  "receiver": { "name": "Ocean Freight", "contact": "..." },
  "bookingStatus": "pending",
  "estimatedCost": 385150
}
```

## Time Scale

**1 ora reale = 1 secondo simulato**

Questo significa:
- Una rotta da Rotterdam a Shanghai (33 ore) viene completata in 33 secondi
- Consente teste e sviluppo rapidi

## Porte e Rotte Realistiche

### Porte Supportate
- Rotterdam, NL
- Singapore, SG
- Shanghai, CN
- Dubai, AE
- Hamburg, DE
- Hong Kong, HK
- Los Angeles, US
- Antwerp, BE
- Kaohsiung, TW
- Genoa, IT

### Rotte Principali
- ROTTERDAM ↔ SHANGHAI: 11.000 km / 33 ore
- ROTTERDAM ↔ DUBAI: 6.700 km / 20 ore
- SINGAPORE ↔ ROTTERDAM: 11.500 km / 34 ore
- SHANGHAI ↔ LOS ANGELES: 6.300 km / 19 ore
- E molte altre...

## Sviluppo

### Build
```bash
cd simulators/{simulator-name}
npm run build
```

### Stop Containers
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f {service-name}
```

## Integrazione con Log Supervisor

I simulatori inviano dati ai seguenti topic Kafka:
- **fleet-positions**: Sottoscritto dal Log Supervisor
- **cargo-requests**: Sottoscritto dal Log Supervisor

Il Log Supervisor a `http://localhost:5173` visualizza:
- 📍 Posizioni navi in tempo reale
- 📦 Richieste cargo in arrivo
- 🌊 Disastri attivi
- 📊 Dashboard di monitoraggio

## Test

### Consumer Kafka (test locale)
```bash
# In un container Kafka
kafka-console-consumer --bootstrap-server kafka:29092 --topic fleet-positions --from-beginning
kafka-console-consumer --bootstrap-server kafka:29092 --topic cargo-requests --from-beginning
```

### cURL per Disaster API
```bash
# Crea disastro
curl -X POST http://localhost:3001/disasters \
  -H "Content-Type: application/json" \
  -d '{"type": "hurricane", "severity": "critical"}'

# Elenco disastri
curl http://localhost:3001/disasters

# Health check
curl http://localhost:3001/health
```

## Troubleshooting

### Kafka non connesso
```
Error: Failed to connect to Kafka
```
Assicurati che Kafka sia in esecuzione:
```bash
docker-compose logs kafka
```

### Port in uso
```
Error: Address already in use :::3001
```
Cambia la porta nel docker-compose.yml o nella variabile `PORT`.

## Struttura Progetto
```
simulators/
├── fleet-simulator/
│   ├── src/
│   │   ├── index.ts        (Main simulator)
│   │   └── constants.ts    (Dati realistici)
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── cargo-simulator/
│   ├── src/
│   │   ├── index.ts
│   │   └── constants.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── disaster-simulator/
│   ├── src/
│   │   ├── index.ts        (Express API)
│   │   └── constants.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml
```

---

Fatto! I simulatori generano dati realistici per il tuo sistema di logistics navale! 🚢📦🌊
