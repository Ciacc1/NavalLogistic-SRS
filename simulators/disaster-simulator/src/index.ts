import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DISASTER_TYPES, PORTS } from './constants';

interface Disaster {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
  affectedArea: string;
  description: string;
  impact: {
    routesClosed: string[];
    delayHours: number;
    affectedVessels: string[];
  };
  startTime: string;
  endTime?: string;
  status: 'active' | 'resolved' | 'monitoring';
}

class DisasterSimulator {
  private app: express.Application;
  private activeDiasters: Map<string, Disaster> = new Map();
  private port: number;
  private disasterGenerationInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.use(express.json());

    // POST /disasters - Crea un nuovo disastro
    this.app.post('/disasters', (req: Request, res: Response) => {
      try {
        const disaster = this.createDisaster(req.body);
        this.activeDiasters.set(disaster.id, disaster);

        console.log(`🌊 Disaster created: ${disaster.type} at ${disaster.location.latitude}, ${disaster.location.longitude}`);

        res.status(201).json(disaster);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    });

    // GET /disasters - Lista tutti i disastri attivi
    this.app.get('/disasters', (req: Request, res: Response) => {
      const disasters = Array.from(this.activeDiasters.values());
      res.json({
        total: disasters.length,
        disasters: disasters,
      });
    });

    // GET /disasters/:id - Ottieni dettagli disastro
    this.app.get('/disasters/:id', (req: Request, res: Response) => {
      const disaster = this.activeDiasters.get(req.params.id);
      if (!disaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      res.json(disaster);
    });

    // DELETE /disasters/:id - Risolvi un disastro
    this.app.delete('/disasters/:id', (req: Request, res: Response) => {
      const disaster = this.activeDiasters.get(req.params.id);
      if (!disaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }

      disaster.status = 'resolved';
      disaster.endTime = new Date().toISOString();

      res.json({ message: 'Disaster resolved', disaster });
      console.log(`✓ Disaster resolved: ${disaster.id}`);
    });

    // POST /disasters/random - Genera un disastro casuale
    this.app.post('/disasters/random', (req: Request, res: Response) => {
      const disaster = this.createRandomDisaster();
      this.activeDiasters.set(disaster.id, disaster);

      console.log(`🌊 Random disaster created: ${disaster.type}`);

      res.status(201).json(disaster);
    });

    // POST /disasters/:id/update-status - Aggiorna status
    this.app.post('/disasters/:id/update-status', (req: Request, res: Response) => {
      const disaster = this.activeDiasters.get(req.params.id);
      if (!disaster) {
        return res.status(404).json({ error: 'Disaster not found' });
      }

      const { status } = req.body;
      if (!['active', 'monitoring', 'resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      disaster.status = status;
      res.json(disaster);
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        activeDiasters: this.activeDiasters.size,
        uptime: process.uptime(),
      });
    });
  }

  private createDisaster(data: any): Disaster {
    const type = data.type || DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)];
    const severity = data.severity || this.getRandomSeverity();

    // Valida tipo disastro
    if (!DISASTER_TYPES.includes(type)) {
      throw new Error(`Invalid disaster type: ${type}`);
    }

    const portKeys = Object.keys(PORTS);
    const randomPort = PORTS[portKeys[Math.floor(Math.random() * portKeys.length)] as keyof typeof PORTS];

    const disaster: Disaster = {
      id: `DIS-${uuidv4().substring(0, 8).toUpperCase()}`,
      type,
      severity,
      location: {
        latitude: randomPort.lat + (Math.random() - 0.5) * 10,
        longitude: randomPort.lng + (Math.random() - 0.5) * 10,
        radius: data.radius || 50 + Math.random() * 150, // 50-200 km
      },
      affectedArea: data.affectedArea || `Region near ${randomPort.name}`,
      description: this.getDisasterDescription(type, severity),
      impact: {
        routesClosed: this.getAffectedRoutes(type),
        delayHours: this.getDelayHours(severity),
        affectedVessels: [],
      },
      startTime: new Date().toISOString(),
      status: 'active',
    };

    return disaster;
  }

  private createRandomDisaster(): Disaster {
    return this.createDisaster({});
  }

  private getRandomSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const rand = Math.random();
    if (rand < 0.5) return 'low';
    if (rand < 0.75) return 'medium';
    if (rand < 0.9) return 'high';
    return 'critical';
  }

  private getDisasterDescription(type: string, severity: string): string {
    const descriptions: Record<string, string> = {
      hurricane: `${severity.toUpperCase()} Hurricane with winds`,
      typhoon: `${severity.toUpperCase()} Typhoon system approaching`,
      extreme_waves: `${severity.toUpperCase()} Extreme wave conditions (>15m)`,
      fog_bank: `Dense fog bank with visibility <100m`,
      engine_failure: `Reported engine failure`,
      mechanical_issue: `Critical mechanical malfunction`,
      route_closure: `Strait/Channel closed - impassable conditions`,
      extreme_cold: `${severity.toUpperCase()} Cold snap with ice formation`,
      extreme_heat: `${severity.toUpperCase()} Heat wave causing equipment failures`,
    };

    return descriptions[type] || type;
  }

  private getAffectedRoutes(type: string): string[] {
    if (type === 'route_closure') {
      return ['ROTTERDAM-SHANGHAI', 'HAMBURG-SINGAPORE'];
    }
    return [];
  }

  private getDelayHours(severity: string): number {
    const delays: Record<string, number> = {
      low: 2,
      medium: 6,
      high: 12,
      critical: 24,
    };
    return delays[severity] || 2;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🌍 Disaster Simulator running on http://localhost:${this.port}`);
      console.log(`📡 API endpoints:`);
      console.log(`  POST   /disasters          - Create disaster`);
      console.log(`  GET    /disasters          - List all disasters`);
      console.log(`  GET    /disasters/:id      - Get disaster details`);
      console.log(`  DELETE /disasters/:id      - Resolve disaster`);
      console.log(`  POST   /disasters/random   - Generate random disaster`);
      console.log(`  GET    /health             - Health check`);
      
      // Start automatic disaster generation every 30-60 seconds
      this.startAutomaticDisasterGeneration();
    });
  }

  private startAutomaticDisasterGeneration() {
    const generateDisaster = () => {
      // 70% chance to generate a disaster randomly
      if (Math.random() < 0.7) {
        const disaster = this.createRandomDisaster();
        this.activeDiasters.set(disaster.id, disaster);
        console.log(`🌊 Random disaster auto-generated: ${disaster.type} (${disaster.severity})`);
      }

      // Schedule next generation in 30-60 seconds
      const nextDelay = 30000 + Math.random() * 30000;
      this.disasterGenerationInterval = setTimeout(generateDisaster, nextDelay);
    };

    // Start the first generation
    generateDisaster();
  }
}

// Main
const simulator = new DisasterSimulator(parseInt(process.env.PORT || '3001', 10));
simulator.start();
