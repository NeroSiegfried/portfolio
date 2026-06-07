#!/usr/bin/env python3
"""
Cost-Optimized Infrastructure for Portfolio
- Replaces RDS Aurora with PostgreSQL on a single EC2 (t4g.small or t3.micro)
- Uses Public Subnets to avoid NAT Gateway costs ($32+/mo saved)
- Retains S3 and CloudFront (Free Tier friendly)
"""

import boto3
import time
import sys

def setup_optimized_ec2():
    ec2 = boto3.client('ec2', region_name='us-east-1')

    print("🚀 Provisioning cost-optimized EC2 for PostgreSQL...")

    # User Data script to install PostgreSQL on Amazon Linux 2023
    user_data = """#!/bin/bash
dnf update -y
dnf install -y postgresql15-server
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL to allow remote connections (secured by SG)
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /var/lib/pgsql/data/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE portfolio_db;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'PortfolioSecure2026!';"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
"""

    try:
        # Create Security Group
        sg = ec2.create_security_group(
            GroupName='portfolio-db-sg-cheap',
            Description='Security group for cost-optimized DB'
        )
        sg_id = sg['GroupId']

        # Allow PG port (Restrict this to your IP/App in production!)
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 5432, 'ToPort': 5432, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )

        # Launch Instance (t4g.small is ~$12/mo, t3.micro is free tier)
        instances = ec2.run_instances(
            ImageId='ami-0440d3b780d96b29d', # Amazon Linux 2023 ARM
            InstanceType='t4g.small',
            MinCount=1,
            MaxCount=1,
            SecurityGroupIds=[sg_id],
            UserData=user_data,
            TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': 'portfolio-db-cheap'}]}]
        )

        instance_id = instances['Instances'][0]['InstanceId']
        print(f"✅ Instance launched: {instance_id}")

        print("⏳ Waiting for public IP...")
        while True:
            desc = ec2.describe_instances(InstanceIds=[instance_id])
            inst = desc['Reservations'][0]['Instances'][0]
            if 'PublicIpAddress' in inst:
                public_ip = inst['PublicIpAddress']
                print(f"✅ Public IP: {public_ip}")
                return public_ip
            time.sleep(5)

    except Exception as e:
        print(f"❌ Failed: {e}")
        return None

if __name__ == "__main__":
    ip = setup_optimized_ec2()
    if ip:
        print(f"\nNEW DATABASE_URL: postgresql://postgres:PortfolioSecure2026!@{ip}:5432/portfolio_db")
        print("Run 'aws rds delete-db-cluster --db-cluster-identifier portfolio-aurora-cluster --skip-final-snapshot' to stop RDS costs.")
