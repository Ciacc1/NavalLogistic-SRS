import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { PORTS, SHIPPING_ROUTES, VESSEL_TYPES, TIME_SCALE, AVERAGE_SHIP_SPEED } from './constants';

interface ShippingRoute {
  from: string;
  to: string;
  distance: number;
  duration: number;
}

interface Waypoint {
  port: string;
  lat: number;
  lng: number;
  eta: number; // minuti
  completed: boolean;
}

interface Ship {
  id: string;
  name: string;
  type: string;
  departurePort: string;
  destinationPort: string;
  currentLat: number;
  currentLng: number;
  speed: number; // nodi
  heading: number; // gradi
  eta: number; // timestamp
  waypoints: Waypoint[];
  status: 'at_port' | 'en_route' | 'in_port';
  startTime: number;
}

class FleetSimulator {
  private kafka: Kafka;
  private producer: any;
  private ships: Ship[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'fleet-simulator',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
  }

  async initialize() {
    await this.producer.connect();
    console.log('✓ Fleet Simulator connected to Kafka');

    // Crea flotta iniziale
    this.createFleet();
    console.log(`✓ Created fleet with ${this.ships.length} vessels`);

    // Avvia simulazione
    this.startSimulation();
  }

  private createFleet() {
    const portKeys = Object.keys(PORTS);
    const routeCount = 5;

    for (let i = 0; i < routeCount; i++) {
      const route = SHIPPING_ROUTES[i % SHIPPING_ROUTES.length];
      const fromPort = PORTS[route.from as keyof typeof PORTS];
      const toPort = PORTS[route.to as keyof typeof PORTS];

      const ship: Ship = {
        id: `SHIP-${uuidv4().substring(0, 8).toUpperCase()}`,
        name: this.generateShipName(),
        type: VESSEL_TYPES[Math.floor(Math.random() * VESSEL_TYPES.length)],
        departurePort: route.from,
        destinationPort: route.to,
        currentLat: fromPort.lat + (Math.random() - 0.5) * 2,
        currentLng: fromPort.lng + (Math.random() - 0.5) * 2,
        speed: AVERAGE_SHIP_SPEED + (Math.random() - 0.5) * 4,
        heading: 0,
        eta: this.startTime + route.duration * 3600 * 1000,
        waypoints: this.generateWaypoints(fromPort, toPort, route.duration),
        status: 'en_route',
        startTime: this.startTime,
      };

      this.ships.push(ship);
    }
  }

  private generateWaypoints(from: any, to: any, routeDurationHours: number): Waypoint[] {
    const waypoints: Waypoint[] = [
      {
        port: 'START',
        lat: from.lat,
        lng: from.lng,
        eta: 0,
        completed: true,
      },
    ];

    // Aggiungi 2-3 waypoint intermedi
    const intermediateCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 1; i <= intermediateCount; i++) {
      const progress = i / (intermediateCount + 1);
      waypoints.push({
        port: `WAYPOINT_${i}`,
        lat: from.lat + (to.lat - from.lat) * progress,
        lng: from.lng + (to.lng - from.lng) * progress,
        eta: routeDurationHours * (progress * 60),
        completed: false,
      });
    }

    waypoints.push({
      port: 'DESTINATION',
      lat: to.lat,
      lng: to.lng,
      eta: routeDurationHours * 60,
      completed: false,
    });

    return waypoints;
  }

  private generateShipName(): string {
    const prefixes = ['MSC', 'MAERSK', 'CMA', 'EVERGREEN', 'HAPAG', 'ONE', 'COSCO'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 10000);
    return `${prefix} ${number}`;
  }

  private updateShipPosition(ship: Ship, deltaTime: number) {
    const elapsedMinutes = (Date.now() - ship.startTime) / (TIME_SCALE * 1000);

    // Calcola posizione lungo la rotta
    const totalDistance = ship.waypoints[ship.waypoints.length - 1].eta;
    const progress = Math.min(elapsedMinutes / totalDistance, 1);

    if (progress >= 1) {
      ship.status = 'in_port';
      ship.currentLat = ship.waypoints[ship.waypoints.length - 1].lat;
      ship.currentLng = ship.waypoints[ship.waypoints.length - 1].lng;
      return;
    }

    // Interpolazione lineare
    const startWaypoint = ship.waypoints[0];
    const endWaypoint = ship.waypoints[ship.waypoints.length - 1];

    ship.currentLat = startWaypoint.lat + (endWaypoint.lat - startWaypoint.lat) * progress;
    ship.currentLng = startWaypoint.lng + (endWaypoint.lng - startWaypoint.lng) * progress;

    // Calcola heading (direzione)
    const dLng = endWaypoint.lng - startWaypoint.lng;
    const dLat = endWaypoint.lat - startWaypoint.lat;
    ship.heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

    // Aggiorna waypoint completati
    ship.waypoints.forEach((wp) => {
      if (wp.eta <= elapsedMinutes && !wp.completed) {
        wp.completed = true;
      }
    });
  }

  private createFleetMessage(ship: Ship) {
    return {
      timestamp: new Date().toISOString(),
      shipId: ship.id,
      name: ship.name,
      type: ship.type,
      position: {
        latitude: ship.currentLat,
        longitude: ship.currentLng,
        heading: ship.heading,
        speed: ship.speed,
      },
      voyage: {
        departure: ship.departurePort,
        destination: ship.destinationPort,
        eta: new Date(ship.eta).toISOString(),
        progress: {
          completedWaypoints: ship.waypoints.filter((wp) => wp.completed).length,
          totalWaypoints: ship.waypoints.length,
          waypoints: ship.waypoints,
        },
      },
      status: ship.status,
    };
  }

  private async startSimulation() {
    const updateInterval = 5000; // Invia aggiornamenti ogni 5 secondi reali

    setInterval(async () => {
      for (const ship of this.ships) {
        this.updateShipPosition(ship, updateInterval);

        const message = this.createFleetMessage(ship);

        try {
          await this.producer.send({
            topic: 'fleet-positions',
            messages: [
              {
                key: ship.id,
                value: JSON.stringify(message),
              },
            ],
          });

          console.log(`[${new Date().toISOString()}] 📍 ${ship.name} @ ${ship.currentLat.toFixed(2)}, ${ship.currentLng.toFixed(2)}`);
        } catch (error) {
          console.error('Error sending fleet message:', error);
        }
      }
    }, updateInterval);
  }

  async shutdown() {
    await this.producer.disconnect();
  }
}

// Main
const simulator = new FleetSimulator();
simulator.initialize().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Fleet Simulator...');
  await simulator.shutdown();
  process.exit(0);
});
