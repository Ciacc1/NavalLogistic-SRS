# Quick Start - NavalLogistic Simulators

## ⚡ Avvio in 30 secondi

### Prerequisito: Docker & Docker Compose
```bash
docker --version  # v24+
docker-compose --version  # v2.20+
```

### 1️⃣ Avvia tutto
```bash
docker-compose up --build
```
Aspetta 2-3 minuti per il build iniziale.

**Output finale**:
```
✓ zookeeper: ready
✓ kafka: ready
✓ fleet-simulator: ready
✓ cargo-simulator: ready
✓ disaster-simulator: running on http://localhost:3001
```

### 2️⃣ Testa i simulatori
```bash
# In un nuovo terminal
curl http://localhost:3001/health
```

Risposta:
```json
{
  "status": "healthy",
  "activeDiasters": 0,
  "uptime": 45.23
}
```

### 3️⃣ Crea un disastro (test)
```bash
curl -X POST http://localhost:3001/disasters/random
```

### 4️⃣ Visualizza disastri attivi
```bash
curl http://localhost:3001/disasters | jq
```

---

## 📊 Comandi Comuni

### Avvio/Stop
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# View specific service
docker-compose logs -f fleet-simulator
```

### Testing API
```bash
# Health check
curl http://localhost:3001/health

# Get disasters
curl http://localhost:3001/disasters

# Create random disaster
curl -X POST http://localhost:3001/disasters/random

# Create specific disaster
curl -X POST http://localhost:3001/disasters \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hurricane",
    "severity": "critical",
    "affectedArea": "Atlantic Ocean"
  }'

# Delete disaster
curl -X DELETE http://localhost:3001/disasters/{disaster-id}
```

### Kafka Topics
```bash
# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server kafka:9092

# Consume fleet positions (in new terminal)
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic fleet-positions \
  --from-beginning

# Consume cargo requests
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic cargo-requests \
  --from-beginning
```

---

## 🔌 Integrare con Log Supervisor

Il Log Supervisor riceve dati dai simulatori:

### 1. Kafka Consumers (Node.js)
```typescript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'log-supervisor',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'log-supervisor-group' });
await consumer.subscribe({ topics: ['fleet-positions', 'cargo-requests'] });

consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const data = JSON.parse(message.value?.toString() || '{}');
    console.log(`[${topic}]`, data);
    
    // Aggiorna UI/Database
    if (topic === 'fleet-positions') {
      updateShipPosition(data);
    } else if (topic === 'cargo-requests') {
      processCargoRequest(data);
    }
  },
});
```

### 2. REST API Client (Disaster)
```typescript
import axios from 'axios';

const disasterAPI = axios.create({
  baseURL: 'http://localhost:3001',
});

// Polling disasters ogni 5 secondi
setInterval(async () => {
  try {
    const { data } = await disasterAPI.get('/disasters');
    console.log('Active disasters:', data.total);
    
    // Update display
    updateDisasterMap(data.disasters);
  } catch (error) {
    console.error('Error fetching disasters:', error);
  }
}, 5000);
```

### 3. WebSocket (real-time updates)
```typescript
// Emit events tra Log Supervisor e API Gateway
io.on('connection', (socket) => {
  consumer.on('message', (message) => {
    socket.emit('fleet:position-update', JSON.parse(message.value));
  });
});
```

---

## 🛠 Sviluppo Locale

Se vuoi modificare i simulatori:

### Opzione 1: Build locale
```bash
./build-local.ps1 install  # Windows PowerShell
# oppure
make install  # Linux/Mac

./build-local.ps1 build
# oppure
make build
```

### Opzione 2: Dev mode (hot reload)
```bash
# Terminal 1: Kafka only
docker-compose up kafka zookeeper

# Terminal 2: Fleet (dev)
cd simulators/fleet-simulator
npm install
npm run dev

# Terminal 3: Cargo (dev)
cd simulators/cargo-simulator
npm install
npm run dev

# Terminal 4: Disaster (dev)
cd simulators/disaster-simulator
npm install
npm run dev
```

---

## 📈 Monitoraggio

### Dashboard Health
```bash
# Check all services
docker-compose ps
```

Output:
```
NAME                    STATUS       PORTS
zookeeper               Up          2181/tcp
kafka                   Up          9092/tcp
fleet-simulator         Up          (no exposed ports)
cargo-simulator         Up          (no exposed ports)
disaster-simulator      Up          0.0.0.0:3001->3001/tcp
```

### Container Logs
```bash
# See everything (last 50 lines)
docker-compose logs --tail=50

# Follow specific container
docker-compose logs -f disaster-simulator
```

### Performance
```bash
# Container resource usage
docker stats

# Docker disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Porta 3001 già in uso
```bash
# Cambia porta nel docker-compose.yml
ports:
  - "3002:3001"  # Usa 3002 invece di 3001

# O usa un'altra porta
docker run -p 3002:3001 disaster-simulator
```

### Kafka non si connette
```bash
# Verifica Kafka sia avviato
docker-compose logs kafka

# Testa connessione
docker-compose exec kafka \
  kafka-broker-api-versions \
  --bootstrap-server localhost:9092
```

### Out of memory / errori build
```bash
# Pulisci tutto
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

### Logs enormi
```bash
# Limita log retention
docker-compose logs --tail=100 -f

# Pulisci log
docker system prune --volumes
```

---

## 📚 Documentazione Completa

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architettura dettagliata
- [README.md](./README.md) - Guida completa
- [API Endpoints](#api-disaster-simulator) - Documentazione API REST

---

## 🚀 Prossimo Passo

Connetti il **Log Supervisor Dashboard** ai simulatori:

1. Leggi [ARCHITECTURE.md](./ARCHITECTURE.md) per dettagli tecnici
2. Sottoscrivi ai Kafka topics nel Log Supervisor
3. Polling/WebSocket per gli updates dei disastri
4. Visualizza tutto in tempo reale! 📊

Buon divertimento! 🚢⚓
