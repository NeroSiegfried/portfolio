#!/bin/bash
# Quick start script for AWS migration

echo "========================================"
echo "  PORTFOLIO AWS MIGRATION - QUICK START"
echo "========================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required"
    exit 1
fi

# Install boto3
echo ""
echo "[1] Installing AWS Python dependencies..."
pip3 install boto3 botocore

# Run setup script
echo ""
echo "[2] Starting AWS infrastructure setup..."
python3 aws/setup-aws.py

# After AWS setup completes
echo ""
echo "========================================"
echo "  NEXT: Database Configuration"
echo "========================================"
echo ""
echo "Run these commands in order:"
echo ""
echo "1. Generate SQL export from current data:"
echo "   npx ts-node aws/migrate-to-postgres.ts"
echo ""
echo "2. Connect to RDS and run schema:"
echo "   psql -h [RDS_ENDPOINT] -U postgres -d portfolio_db -f aws/postgres-schema.sql"
echo ""
echo "3. Import your data:"
echo "   psql -h [RDS_ENDPOINT] -U postgres -d portfolio_db -f aws/data-export.sql"
echo ""
echo "4. Update .env.local with credentials from aws/aws-config.txt"
echo ""
echo "5. Install pg driver:"
echo "   npm install pg @types/pg"
echo ""
echo "6. Update lib/blog/store.ts to use PostgreSQL (see lib/blog/db-postgres.ts)"
