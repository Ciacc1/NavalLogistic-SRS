#!/bin/bash
# Script di test per i simulatori

echo "🚀 NavalLogistic Simulators - Test Script"
echo "=========================================="
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Health Check
echo -e "${YELLOW}1. Testing Disaster Simulator Health...${NC}"
HEALTH=$(curl -s http://localhost:3001/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Disaster Simulator is healthy${NC}"
    echo "  Response: $HEALTH"
else
    echo -e "${RED}✗ Disaster Simulator is not responding${NC}"
fi
echo ""

# Test Create Disaster
echo -e "${YELLOW}2. Creating a test disaster...${NC}"
DISASTER=$(curl -s -X POST http://localhost:3001/disasters/random)
DISASTER_ID=$(echo $DISASTER | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$DISASTER_ID" ]; then
    echo -e "${GREEN}✓ Disaster created: $DISASTER_ID${NC}"
else
    echo -e "${RED}✗ Failed to create disaster${NC}"
fi
echo ""

# Test List Disasters
echo -e "${YELLOW}3. Listing all disasters...${NC}"
DISASTERS=$(curl -s http://localhost:3001/disasters)
echo "  Response: $DISASTERS"
echo ""

# Test Kafka Connection (if kafka-console-consumer is available)
echo -e "${YELLOW}4. Checking Kafka connectivity...${NC}"
if command -v kafka-console-consumer &> /dev/null; then
    echo -e "${GREEN}✓ kafka-console-consumer is available${NC}"
    echo "  To consume messages:"
    echo "  kafka-console-consumer --bootstrap-server localhost:9092 --topic fleet-positions"
    echo "  kafka-console-consumer --bootstrap-server localhost:9092 --topic cargo-requests"
else
    echo -e "${YELLOW}⚠ kafka-console-consumer not found (optional)${NC}"
fi
echo ""

# Test API Endpoints
echo -e "${YELLOW}5. Testing API Endpoints...${NC}"
echo ""

echo "  a) GET /disasters"
curl -s http://localhost:3001/disasters | head -c 100
echo "..."
echo ""

if [ ! -z "$DISASTER_ID" ]; then
    echo "  b) GET /disasters/$DISASTER_ID"
    curl -s http://localhost:3001/disasters/$DISASTER_ID | head -c 100
    echo "..."
    echo ""
fi

echo -e "${YELLOW}6. Creating disasters with different types...${NC}"
TYPES=("hurricane" "typhoon" "route_closure" "fog_bank")
for TYPE in "${TYPES[@]}"; do
    curl -s -X POST http://localhost:3001/disasters \
      -H "Content-Type: application/json" \
      -d "{\"type\": \"$TYPE\", \"severity\": \"high\"}" > /dev/null
    echo -e "${GREEN}✓ Created disaster: $TYPE${NC}"
done
echo ""

echo -e "${YELLOW}7. Final Disaster Count...${NC}"
FINAL_COUNT=$(curl -s http://localhost:3001/disasters | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}Active disasters: $FINAL_COUNT${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "✓ All tests completed!"
echo "==========================================${NC}"
