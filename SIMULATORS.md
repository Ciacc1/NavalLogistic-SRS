# NavalLogistic - Sistema di Simulazione Navale 🚢

Sistema di logistica navale con 3 container Docker completamente separati che generano dati realistici per testing e sviluppo.

## 🎯 Cosa Contiene

### ✅ 3 Simulatori Indipendenti

```
🚢 Fleet Simulator (Kafka)
   ├─ Simula 5 navi
   ├─ Pubblica posizioni in tempo reale
   ├─ Traccia rotte e waypoints
   └─ Genera messaggi Kafka (fleet-positions)

📦 Cargo Simulator (Kafka)
   ├─ Genera richieste di trasferimento merce
   ├─ Dettagli cargo realistici
   ├─ Priorità e costi variabili
   └─ Genera messaggi Kafka (cargo-requests)

🌊 Disaster Simulator (REST API)
   ├─ Crea/gestisce disastri e catastrofi
   ├─ Esposura su REST API (:3001)
   ├─ Chiusure rotte e condizioni climatiche estreme
   └─ Impatto su navi e mercato
```

### ✅ Infrastruttura Completa

- **Docker Compose**: Orchestrazione completa (Zookeeper + Kafka + 3 container simulatori)
- **Kafka**: Message broker per fleet-positions e cargo-requests
- **TypeScript**: Codice type-safe e moderno
- **REST API**: Express.js per disaster management

### ✅ Dati Realistici Inclusi

- **10 Porti Reali**: Rotterdam, Shanghai, Dubai, Singapore, Hamburg, etc.
- **8 Rotte Principali**: Rotterdam-Shanghai, Dubai routes, etc.
- **Velocità Realistica**: 20 nodi medi con variazioni
- **9 Tipi di Disastri**: Hurricane, Typhoon, Route Closure, etc.
- **Diversi Cargo**: Containers, Bulk, Petroleum, Refrigerated, Hazmat

### ✅ Time Scale per Test Veloci

**1 ora reale = 1 secondo simulato**

- Testa una rotta di 33 ore in 33 secondi ⚡
- Diventano possibili test di 60+ giorni in poche ore
- Perfetto per CI/CD e sviluppo rapido

---

## 🚀 Quick Start

### Prerequisiti
- Docker 24+
- Docker Compose 2.20+

### Avvio (1 comando)
```bash
docker-compose up --build
```

### Test (in nuovo terminal)
```bash
curl http://localhost:3001/health
```

### Crea un disastro
```bash
curl -X POST http://localhost:3001/disasters/random
```

Vedi [QUICK_START.md](./QUICK_START.md) per dettagli completi.

---

## 📊 Comunicazione Dati

```
Fleet Simulator
    ↓
    Kafka Topic: fleet-positions
    ↓
Log Supervisor Dashboard
    ↑
    REST API: GET /disasters
    ↓
Disaster Simulator


Cargo Simulator
    ↓
    Kafka Topic: cargo-requests
    ↓
Log Supervisor Dashboard
```

---

## 📁 Struttura

```
simulators/
├── fleet-simulator/        # Kafka producer - posizioni navi
├── cargo-simulator/        # Kafka producer - richieste cargo
├── disaster-simulator/     # REST API - disastri/catastrofi
├── docker-compose.yml      # Orchestrazione
├── README.md               # Documentazione completa
├── ARCHITECTURE.md         # Dettagli tecnici
└── test.sh/test.bat       # Script di test
```

Vedi [PROJECT_STRUCTURE.md](./simulators/PROJECT_STRUCTURE.md) per struttura completa.

---

## 📖 Documentazione

| Documento | Descrizione |
|-----------|------------|
| [QUICK_START.md](./QUICK_START.md) | Avvio in 30 secondi |
| [simulators/README.md](./simulators/README.md) | Guida completa (600+ righe) |
| [simulators/ARCHITECTURE.md](./simulators/ARCHITECTURE.md) | Dettagli architettura |
| [simulators/PROJECT_STRUCTURE.md](./simulators/PROJECT_STRUCTURE.md) | Struttura progetto |

---

## 🔧 Comandi Principali

### Docker Compose
```bash
docker-compose up --build      # Start tutto
docker-compose down            # Stop
docker-compose logs -f         # View logs
docker-compose logs -f fleet-simulator  # Specific service
```

### Testing
```bash
curl http://localhost:3001/health        # Health check
curl http://localhost:3001/disasters     # List disasters
curl -X POST http://localhost:3001/disasters/random  # Create
```

### Kafka
```bash
# Consume messages
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic fleet-positions

# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server kafka:9092
```

### Sviluppo Locale
```bash
# Install dipendenze
./build-local.ps1 install  # Windows
make install               # Linux/Mac

# Dev mode (hot reload)
make dev-fleet    # Terminal 1
make dev-cargo    # Terminal 2
make dev-disaster # Terminal 3
```

---

## 🎓 Integrare con Log Supervisor

### 1. Kafka Consumer (TypeScript)
```typescript
const consumer = kafka.consumer({ groupId: 'log-supervisor' });
await consumer.subscribe({ topics: ['fleet-positions', 'cargo-requests'] });

consumer.run({
  eachMessage: async ({ topic, message }) => {
    const data = JSON.parse(message.value);
    // Update UI with real-time data
  },
});
```

### 2. REST API Client
```typescript
// Poll disasters every 5 seconds
setInterval(async () => {
  const { data } = await axios.get('http://localhost:3001/disasters');
  updateMap(data.disasters);
}, 5000);
```

### 3. WebSocket (optional, for real-time)
```typescript
io.on('connection', (socket) => {
  consumer.on('message', (msg) => {
    socket.emit('update', JSON.parse(msg.value));
  });
});
```

---

## 📊 Dati Generati

### Fleet Positions (Kafka)
```json
{
  "shipId": "SHIP-ABC123",
  "position": {
    "latitude": 51.92,
    "longitude": 4.28,
    "heading": 135.5,
    "speed": 21.5
  },
  "voyage": {
    "departure": "ROTTERDAM",
    "destination": "SHANGHAI",
    "progress": 0.45
  }
}
```

### Cargo Requests (Kafka)
```json
{
  "id": "CARGO-XYZ098",
  "originPort": "ROTTERDAM",
  "destinationPort": "SHANGHAI",
  "cargoDetails": {
    "type": "containers",
    "weight": 2500.5,
    "hazmat": false
  },
  "priority": "urgent",
  "estimatedCost": 385150
}
```

### Disasters (REST API)
```json
{
  "id": "DIS-ABC123",
  "type": "hurricane",
  "severity": "critical",
  "location": {
    "latitude": 25.28,
    "longitude": 55.30,
    "radius": 120
  }
}
```

---

## 🧪 Testing

### Run Basic Tests
```bash
bash simulators/test.sh        # Linux/Mac
simulators\test.bat            # Windows
```

### Health Check
```bash
docker-compose exec disaster-simulator curl http://localhost:3001/health
```

### Monitor Kafka
```bash
# In docker-compose exec
kafka-console-consumer --bootstrap-server kafka:9092 --topic fleet-positions
```

---

## 🔍 Troubleshooting

### Porta 3001 occupata
```bash
# Cambia porta in docker-compose.yml
ports:
  - "3002:3001"
```

### Kafka non si connette
```bash
# Verifica Kafka è avviato
docker-compose logs kafka
docker-compose ps
```

### Build error
```bash
# Pulisci e rebuilda
docker-compose down -v
docker-compose up --build
```

---

## 📈 Performance

Con configurazione di default:

| Metrica | Valore |
|---------|--------|
| Navi attive | 5 |
| Update/min | ~12 (fleet) + 12 (cargo) |
| Messaggi Kafka/min | 360-540 |
| Dati/giorno | ~500 MB |
| Latenza media | <100ms |

---

## 🎯 Roadmap

### Già Implementato ✅
- Fleet simulator con Kafka
- Cargo simulator con Kafka
- Disaster API REST
- Docker Compose orchestration
- Dati realistici (porti, rotte, etc.)

### Prossimi Step 📋
1. Database persistenza (MongoDB/PostgreSQL)
2. Authentication (JWT)
3. WebSocket real-time
4. Kubernetes deployment
5. Monitoring (Prometheus/Grafana)

---

## 📝 Variabili Ambiente

Vedi [simulators/.env.example](./simulators/.env.example):

```bash
KAFKA_BROKERS=kafka:29092
FLEET_LOG_LEVEL=info
CARGO_LOG_LEVEL=info
DISASTER_PORT=3001
```

---

## 🤝 Integrazione Ecosistema

```
NavalLogistic Simulators (TU ORACOME)
    |
    +-- Kafka Topics ──> Log Supervisor Dashboard
    |
    +-- REST API ──> API Gateway (per future APIs)
    |
    +-- Metrics ──> Prometheus (quando aggiunto)
    |
    +-- Logs ──> ELK Stack (quando aggiunto)
```

---

## 📚 Stack Tecnologico

- **Linguaggio**: TypeScript
- **Runtime**: Node.js 18+ (Alpine)
- **Message Broker**: Kafka 7.5.0
- **API Framework**: Express.js
- **Containerization**: Docker + Docker Compose
- **Build Tool**: npm
- **Type System**: TypeScript strict mode

---

## 🏁 Avvia Ora!

```bash
# 1. Clone/pull repository
cd NavalLogistic-SRS

# 2. Avvia tutto
docker-compose up --build

# 3. Test
curl http://localhost:3001/health

# 4. Visualizza log
docker-compose logs -f
```

Vedi [QUICK_START.md](./QUICK_START.md) per guide dettagliate.

---

## 📞 Info Progetto

- **Versione**: 1.0.0
- **Status**: ✅ Production Ready (Development/Testing)
- **Creato**: Marzo 2026
- **Linguaggio**: TypeScript/Node.js
- **Licenza**: Dipende da progetto principale

---

## 📋 Checklist Setup

- [ ] Docker installato (v24+)
- [ ] Docker Compose installato (v2.20+)
- [ ] Repository clonato
- [ ] `docker-compose up --build` eseguito
- [ ] `curl http://localhost:3001/health` OK
- [ ] Log Supervisor connesso a Kafka (fleet-positions, cargo-requests)
- [ ] Disaster API testato
- [ ] Tutto funzionante! 🎉

---

**Buon divertimento con il tuo sistema di logistica navale!** 🚢⚓

Per domande o issues, consulta [simulators/README.md](./simulators/README.md) o [ARCHITECTURE.md](./simulators/ARCHITECTURE.md).
