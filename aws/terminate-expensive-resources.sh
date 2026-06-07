#!/bin/bash
# Script to terminate expensive AWS resources

echo "⚠️  WARNING: This will delete your RDS Aurora Cluster and NAT Gateways."
echo "Make sure you have exported your data if needed (use aws/rds-import.py or pg_dump)."

# 1. Delete RDS Aurora Cluster
echo "🗑️  Deleting RDS Aurora Cluster..."
aws rds delete-db-cluster \
    --db-cluster-identifier portfolio-aurora-cluster \
    --skip-final-snapshot

# 2. Identify and Delete NAT Gateways (The silent killers)
echo "🔍 Searching for NAT Gateways..."
NAT_IDS=$(aws ec2 describe-nat-gateways --query 'NatGateways[?State==`available`].NatGatewayId' --output text)

for ID in $NAT_IDS; do
    echo "🗑️  Deleting NAT Gateway: $ID"
    aws ec2 delete-nat-gateway --nat-gateway-id $ID
done

# 3. Release Elastic IPs associated with NAT Gateways
echo "💡 Remember to release unused Elastic IPs in the console to avoid the $3.60/mo idle fee."
