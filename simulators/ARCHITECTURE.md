# Architettura - NavalLogistic Simulators

## Overview

Il sistema è composto da **3 container Docker completamente separati** che simulano i diversi aspetti della logistica navale, permettendo di generare dati realistici per testing e sviluppo.

## Componenti

### 1. 🚢 Fleet Simulator (Kafka Producer)
**Porta**: Interna  
**Comunicazione**: Kafka (Topic: `fleet-positions`)  
**Frequenza**: Ogni 5 secondi reali  
**Time Scale**: 1 ora reale = 1 secondo simulato

**Dati Generati**:
```json
{
  "shipId": "SHIP-ABC123",
  "name": "MSC 1234",
  "position": {
    "latitude": 51.92,
    "longitude": 4.28,
    "heading": 135.5,
    "speed": 21.5
  },
  "voyage": {
    "departure": "ROTTERDAM",
    "destination": "SHANGHAI",
    "distance": 11000,
    "eta": "2024-04-07T10:30:00Z",
    "waypoints": [...],
    "progress": 0.45
  },
  "status": "en_route"
}
```

**Caratteristiche**:
- Simula una flotta iniziale di 5 navi
- Naviga tra porti reali (Rotterdam, Shanghai, Dubai, etc.)
- Aggiorna posizione lungo la rotta in tempo reale
- Traccia waypoint (fermate intermedie)
- Calcola ETA (estimated time of arrival)

---

### 2. 📦 Cargo Simulator (Kafka Producer)
**Porta**: Interna  
**Comunicazione**: Kafka (Topic: `cargo-requests`)  
**Frequenza**: Ogni 3-8 secondi reali (randomizzato)  

**Dati Generati**:
```json
{
  "id": "CARGO-XYZ098",
  "originPort": "ROTTERDAM",
  "destinationPort": "SHANGHAI",
  "cargoDetails": {
    "type": "containers",
    "weight": 2500.5,
    "containers": 100,
    "hazmat": false,
    "requiresTemperatureControl": false
  },
  "priority": "urgent",
  "estimatedCost": 385150,
  "shipper": { "name": "Global Logistics", "contact": "..." },
  "receiver": { "name": "Ocean Freight", "contact": "..." },
  "pickupDate": "2024-03-31T12:00:00Z",
  "deliveryDate": "2024-04-10T18:00:00Z",
  "bookingStatus": "pending"
}
```

**Caratteristiche**:
- Genera richieste cargo casuali
- Diversi tipi di merce (containers, bulk, petroleum, etc.)
- Priorità variabili (low, normal, high, urgent)
- Percorsi casuali tra i porti
- Hazmat e refrigerated cargo

---

### 3. 🌊 Disaster Simulator (REST API)
**Porta**: `3001`  
**Comunicazione**: HTTP REST API  
**Frequenza**: Su richiesta (non automatico)  

**Endpoint Principali**:

```bash
# Creare disastro casuale
POST /disasters/random

# Creare disastro specifico
POST /disasters
Body: { "type": "hurricane", "severity": "critical" }

# Listare disastri attivi
GET /disasters

# Ottenere dettagli
GET /disasters/{id}

# Risolvere disastro
DELETE /disasters/{id}

# Health check
GET /health
```

**Dati di Risposta**:
```json
{
  "id": "DIS-ABC123",
  "type": "hurricane",
  "severity": "critical",
  "location": {
    "latitude": 25.28,
    "longitude": 55.30,
    "radius": 120
  },
  "impact": {
    "delayHours": 24,
    "routesClosed": ["ROTTERDAM-SHANGHAI"],
    "affectedVessels": []
  },
  "status": "active",
  "startTime": "2024-03-31T10:30:00Z"
}
```

**Tipi di Disastri**:
- `hurricane` / `typhoon` - Storm systems
- `extreme_waves` (>15m) - Tempeste maritime
- `fog_bank` - Visibilità ridotta
- `engine_failure` / `mechanical_issue` - Danni tecnici
- `route_closure` - Stretto/canale impraticabile
- `extreme_cold` / `extreme_heat` - Condizioni climatiche

---

## Architettura Tecnica

```
┌──────────────────────────────────────────────────────────┐
│              Docker Compose Network                       │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Kafka Infrastructure                         │  │
│  │  ┌────────────┐         ┌────────────┐              │  │
│  │  │ Zookeeper  │ ◄─────► │   Kafka    │              │  │
│  │  │ :2181      │         │ :29092     │              │  │
│  │  └────────────┘         └────────────┘              │  │
│  └──────────────┬──────────────┬──────────────────────┘  │
│                 │              │                          │
│     ┌───────────┘              └──────────────┐          │
│     │                                         │          │
│  ┌──▼──────────────┐  ┌───────────────────┐  │          │
│  │ Fleet Simulator │  │ Cargo Simulator   │  │          │
│  │ (Container)     │  │ (Container)       │  │          │
│  │ :NODE           │  │ :NODE             │  │          │
│  └────────┬────────┘  └─────────┬─────────┘  │          │
│           │                     │            │          │
│           └─────┬──Kafka Messages──┬─────────┘          │
│                 │                  │                    │
│           ┌─────▼──────────────────▼──────┐             │
│           │   Kafka Topics                │             │
│           │ • fleet-positions             │             │
│           │ • cargo-requests              │             │
│           └──────────────────────────────┘             │
│                                                         │
│  ┌───────────────────────────────────────────┐         │
│  │ Disaster Simulator (Container)            │         │
│  │ Express.js REST API                       │         │
│  │ :3001                                     │         │
│  │ POST/GET/DELETE /disasters                │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Network: simulator-network
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│         Log Supervisor Dashboard                         │
│         (separate container/service)                     │
│         • Kafka Consumer                                 │
│         • REST API Client                                │
│         • Real-time WebSocket updates                    │
│         http://localhost:5173                            │
└──────────────────────────────────────────────────────────┘
```

---

## Flusso Dati

### 1. Fleet Positions
```
Fleet Simulator ──Kafka──► fleet-positions topic ──────┐
                                                        │
                                                        ▼
                                      Log Supervisor reads messages
                                      Updates ship positions on map
                                      Calculates ETAs
                                      Tracks voyage progress
```

### 2. Cargo Requests
```
Cargo Simulator ──Kafka──► cargo-requests topic ───────┐
                                                        │
                                                        ▼
                                      Log Supervisor processes requests
                                      Matches with available ships
                                      Calculates costs
                                      Manages booking lifecycle
```

### 3. Disasters
```
Disaster API (REST)  ─── /disasters endpoint ──────────┐
                                                        │
                                                        ▼
                                      Log Supervisor polls /disasters
                                      Updates affected routes
                                      Reroutes cargo/ships
                                      Tracks impact
```

---

## Time Scale Simulation

**1 ora simulata = 1 secondo reale**

Questo permette:
- ✅ Testing rapido delle rotte (33 ore di viaggio = 33 secondi)
- ✅ Verificare comportamenti su periodi lunghi in tempo reale
- ✅ Sviluppo veloce senza aspettare giorni

**Conversione**:
- 1 secondo reale = 3600 secondi simulati (1 ora)
- 1 minuto reale = 60 ore simulate (2.5 giorni)
- 1 ora reale = 60 giorni simulati

---

## Dati Realistici

### Porti (10 hub globali)
| Porto | Paese | Lat/Lng |
|-------|-------|---------|
| Rotterdam | NL | 51.92, 4.28 |
| Singapore | SG | 1.35, 103.82 |
| Shanghai | CN | 31.23, 121.47 |
| Dubai | AE | 25.28, 55.30 |
| Hamburg | DE | 53.55, 9.99 |
| Hong Kong | HK | 22.28, 114.16 |
| Los Angeles | US | 34.05, -118.24 |
| Antwerp | BE | 51.22, 4.40 |
| Kaohsiung | TW | 22.59, 120.27 |
| Genoa | IT | 44.41, 8.95 |

### Rotte Principali
| Rotta | Distanza | Durata (ore) |
|-------|----------|-------------|
| Rotterdam ↔ Shanghai | 11.000 km | 33h |
| Rotterdam ↔ Dubai | 6.700 km | 20h |
| Singapore ↔ Rotterdam | 11.500 km | 34h |
| Shanghai ↔ LA | 6.300 km | 19h |

### Tipi di Navi
- Container Ship (più comuni)
- Bulk Carrier (cereali, minerali)
- Tanker (petrolio, gas)
- RoRo Ship (auto, macchinari)
- General Cargo (merci misto)

### Velocità Media
20 nodi (~37 km/h) con variazione ±2 nodi

---

## Integrazione con Log Supervisor

Il Log Supervisor si collega ai simulatori:

```typescript
// Kafka Consumer
const consumer = kafka.consumer({ groupId: 'log-supervisor' });
await consumer.subscribe({ topics: ['fleet-positions', 'cargo-requests'] });

// REST API Client
const disasterAPI = axios.create({ baseURL: 'http://localhost:3001' });

// Polling disasters
setInterval(async () => {
  const response = await disasterAPI.get('/disasters');
  updateDisastersList(response.data.disasters);
}, 5000);
```

---

## Performance & Scalability

### Capacità Attuali
- **Fleet**: 5 navi in simulazione
- **Cargo**: Generazione continua di richieste
- **Disasters**: Illimitati (in memoria)

### Scaling
Per aumentare il carico:

1. **Aumentare navi**: Modificare `createFleet()` nel fleet simulator
2. **Disaster cloud**: Aggiungere database (MongoDB/PostgreSQL)
3. **Kafka partizioni**: Aumentare per parallelizzare consumers
4. **Horizontal scaling**: Deploy su Kubernetes

---

## Monitoraggio & Debugging

### Logs
```bash
# Tutti i simulatori
docker-compose logs -f

# Specifico
docker-compose logs -f fleet-simulator
docker-compose logs -f cargo-simulator
docker-compose logs -f disaster-simulator
```

### Kafka Topics
```bash
# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server kafka:9092

# Consume messages
docker-compose exec kafka kafka-console-consumer --bootstrap-server kafka:9092 --topic fleet-positions --from-beginning

docker-compose exec kafka kafka-console-consumer --bootstrap-server kafka:9092 --topic cargo-requests --from-beginning
```

### Health Checks
```bash
# Disaster API
curl http://localhost:3001/health

# Kafka
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

---

## Development Workflow

### 1. Modifica un Simulator
```bash
cd simulators/fleet-simulator
npm run build
docker-compose up --build fleet-simulator
```

### 2. Testare API
```bash
# Creare disastro
curl -X POST http://localhost:3001/disasters/random

# Verificare status
curl http://localhost:3001/disasters | jq
```

### 3. Debug Locale
```bash
# Terminal 1: Kafka only
docker-compose up kafka zookeeper

# Terminal 2: Fleet (dev mode)
cd simulators/fleet-simulator
npm run dev

# Terminal 3: Cargo (dev mode)
cd simulators/cargo-simulator
npm run dev

# Terminal 4: Disaster (dev mode)
cd simulators/disaster-simulator
npm run dev
```

---

## Prossime Evoluzioni

1. **Persistenza**: Database per storare disasters, cargo history
2. **Authentication**: JWT per API Disaster
3. **WebSocket**: Real-time updates instead of polling
4. **Metrics**: Prometheus/Grafana per monitoring
5. **Multi-language**: Versioni in Python/Go per altri simulatori
6. **Kubernetes**: Helm charts per deployment enterprise
7. **AI Integration**: Machine learning per ottimizzazione rotte

---

Ultimo aggiornamento: Marzo 2026 🚀
