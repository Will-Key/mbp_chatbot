#!/bin/bash

echo "📊 État des services"
echo "===================="
echo ""
echo "🔴 PRODUCTION:"
docker-compose -f docker-compose.prod.yml ps
echo ""
echo "🟡 TEST:"
docker-compose -f docker-compose.test.yml ps