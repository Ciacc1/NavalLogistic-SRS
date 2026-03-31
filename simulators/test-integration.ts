#!/usr/bin/env node

/**
 * Utility per testare i simulatori e le integrazioni Kafka
 */

import { Kafka } from 'kafkajs';
import axios from 'axios';

const DISASTER_API = 'http://localhost:3001';
const KAFKA_BROKERS = ['localhost:9092'];

async function testDisasterAPI() {
  console.log('\n📡 Testing Disaster Simulator API...');
  console.log('====================================\n');

  try {
    // Health check
    console.log('1️⃣  Health Check...');
    const health = await axios.get(`${DISASTER_API}/health`);
    console.log('✓ API is healthy:', health.data);

    // Create random disaster
    console.log('\n2️⃣  Creating random disaster...');
    const disaster = await axios.post(`${DISASTER_API}/disasters/random`);
    console.log('✓ Disaster created:', disaster.data.id, `(${disaster.data.type})`);

    // List all
    console.log('\n3️⃣  Listing all disasters...');
    const list = await axios.get(`${DISASTER_API}/disasters`);
    console.log(`✓ Found ${list.data.total} active disasters`);

    // Create specific type
    console.log('\n4️⃣  Creating specific disaster (route_closure)...');
    const specific = await axios.post(`${DISASTER_API}/disasters`, {
      type: 'route_closure',
      severity: 'critical',
      affectedArea: 'Strait of Malacca',
    });
    console.log('✓ Specific disaster created:', specific.data.id);

    // Resolve it
    console.log('\n5️⃣  Resolving disaster...');
    const resolved = await axios.delete(`${DISASTER_API}/disasters/${specific.data.id}`);
    console.log('✓ Disaster resolved');

    console.log('\n✅ All API tests passed!');
  } catch (error: any) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testKafkaConnection() {
  console.log('\n🔌 Testing Kafka Connection...');
  console.log('====================================\n');

  const kafka = new Kafka({
    clientId: 'test-client',
    brokers: KAFKA_BROKERS,
  });

  try {
    const admin = kafka.admin();
    await admin.connect();
    console.log('✓ Connected to Kafka');

    // List topics
    const topics = await admin.listTopics();
    console.log(`✓ Found ${topics.length} topics:`);
    topics.forEach((t) => console.log(`  - ${t}`));

    // Check for simulator topics
    const hasFleetTopic = topics.includes('fleet-positions');
    const hasCargoTopic = topics.includes('cargo-requests');

    console.log(`\n${hasFleetTopic ? '✓' : '✗'} fleet-positions topic`);
    console.log(`${hasCargoTopic ? '✓' : '✗'} cargo-requests topic`);

    if (hasFleetTopic || hasCargoTopic) {
      console.log('\n✅ Kafka topics are ready!');
    } else {
      console.log('\n⚠️  Simulator topics not created yet. They will be auto-created when simulators start.');
    }

    await admin.disconnect();
  } catch (error: any) {
    console.error('❌ Kafka test failed:', error.message);
    console.error('Make sure Kafka is running: docker-compose up kafka zookeeper');
  }
}

async function main() {
  console.log('🚀 NavalLogistic Simulators - Integration Test');
  console.log('===============================================');

  await testDisasterAPI();
  await testKafkaConnection();

  console.log('\n===============================================');
  console.log('✅ All tests completed!');
  console.log('===============================================\n');
}

main().catch(console.error);
