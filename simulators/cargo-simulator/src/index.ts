import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { PORTS, CARGO_TYPES } from './constants';

interface CargoRequest {
  id: string;
  timestamp: string;
  originPort: string;
  destinationPort: string;
  cargoDetails: {
    type: string;
    weight: number; // tonnellate
    containers: number;
    hazmat: boolean;
    requiresTemperatureControl: boolean;
  };
  pickupDate: string;
  deliveryDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  shipper: {
    name: string;
    contact: string;
  };
  receiver: {
    name: string;
    contact: string;
  };
  bookingStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  estimatedCost: number; // USD
}

class CargoSimulator {
  private kafka: Kafka;
  private producer: any;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'cargo-simulator',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    this.producer = this.kafka.producer();
  }

  async initialize() {
    await this.producer.connect();
    console.log('✓ Cargo Simulator connected to Kafka');

    // Avvia simulazione di richieste cargo
    this.startCargoSimulation();
  }

  private generateCargoRequest(): CargoRequest {
    const portKeys = Object.keys(PORTS);
    const originKey = portKeys[Math.floor(Math.random() * portKeys.length)];
    let destinationKey = portKeys[Math.floor(Math.random() * portKeys.length)];

    // Assicura che destinazione ≠ origine
    while (destinationKey === originKey) {
      destinationKey = portKeys[Math.floor(Math.random() * portKeys.length)];
    }

    const originPort = PORTS[originKey as keyof typeof PORTS];
    const destinationPort = PORTS[destinationKey as keyof typeof PORTS];

    const cargoType = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
    const weight = 100 + Math.random() * 4900; // 100-5000 tonnellate
    const containers = Math.ceil(weight / 25); // ~25 tonnellate per container

    const pickupDate = new Date();
    const deliveryDate = new Date(pickupDate.getTime() + (10 + Math.random() * 20) * 24 * 60 * 60 * 1000);

    const priority = this.getRandomPriority();

    const estimatedCost = 500 + weight * 150 + (priority === 'urgent' ? 5000 : 0);

    return {
      id: `CARGO-${uuidv4().substring(0, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      originPort: originKey,
      destinationPort: destinationKey,
      cargoDetails: {
        type: cargoType,
        weight: Math.round(weight * 100) / 100,
        containers,
        hazmat: Math.random() < 0.1, // 10% hazmat
        requiresTemperatureControl: cargoType === 'refrigerated' || Math.random() < 0.15,
      },
      pickupDate: pickupDate.toISOString(),
      deliveryDate: deliveryDate.toISOString(),
      priority,
      shipper: {
        name: this.generateCompanyName(),
        contact: `shipper-${Math.floor(Math.random() * 10000)}@company.com`,
      },
      receiver: {
        name: this.generateCompanyName(),
        contact: `receiver-${Math.floor(Math.random() * 10000)}@company.com`,
      },
      bookingStatus: 'pending',
      estimatedCost: Math.round(estimatedCost),
    };
  }

  private getRandomPriority(): 'low' | 'normal' | 'high' | 'urgent' {
    const rand = Math.random();
    if (rand < 0.6) return 'normal';
    if (rand < 0.8) return 'high';
    if (rand < 0.95) return 'low';
    return 'urgent';
  }

  private generateCompanyName(): string {
    const names = ['Global Logistics', 'Maritime Trade Co.', 'Ocean Freight', 'Cargo Express', 'World Shipping', 'Atlantic Lines', 'Pacific Traders', 'Global Distributors'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private async startCargoSimulation() {
    // Genera nuove richieste cargo ogni 3-8 secondi reali
    setInterval(async () => {
      const cargoRequest = this.generateCargoRequest();

      try {
        await this.producer.send({
          topic: 'cargo-requests',
          messages: [
            {
              key: cargoRequest.id,
              value: JSON.stringify(cargoRequest),
            },
          ],
        });

        console.log(`[${new Date().toISOString()}] 📦 Cargo Request: ${cargoRequest.id} | ${cargoRequest.originPort} → ${cargoRequest.destinationPort} | ${cargoRequest.cargoDetails.weight}t | Priority: ${cargoRequest.priority}`);
      } catch (error) {
        console.error('Error sending cargo message:', error);
      }
    }, 3000 + Math.random() * 5000);
  }

  async shutdown() {
    await this.producer.disconnect();
  }
}

// Main
const simulator = new CargoSimulator();
simulator.initialize().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Cargo Simulator...');
  await simulator.shutdown();
  process.exit(0);
});
