#!/usr/bin/env python3
"""
Cost-Optimized Infrastructure for Portfolio
- Replaces RDS Aurora with PostgreSQL on a single EC2 (t3.micro)
- Automatically updates .env.local and migration scripts
"""

import boto3
import time
import os
import re
from botocore.exceptions import ClientError

def update_file(path, pattern, replacement):
    if not os.path.exists(path): return
    with open(path, 'r') as f: content = f.read()
    new_content = re.sub(pattern, replacement, content)
    with open(path, 'w') as f: f.write(new_content)

def setup_optimized_ec2():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    password = 'PortfolioSecure2026!'

    print("🚀 Provisioning cost-optimized EC2 for PostgreSQL...")

    # User Data script with increased reliability and modern SCRAM auth
    user_data = f"""#!/bin/bash
dnf install -y postgresql15-server
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /var/lib/pgsql/data/postgresql.conf
echo "host    all             all             0.0.0.0/0               scram-sha-256" >> /var/lib/pgsql/data/pg_hba.conf
systemctl restart postgresql
# Wait loop to ensure password actually gets set
for i in {{1..20}}; do
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '{password}';" && \
  sudo -u postgres psql -c "CREATE DATABASE portfolio_db;" && break
  sleep 5
done
"""

    try:
        # 1. Security Group
        sg_name = 'portfolio-db-sg-cheap'
        try:
            sg = ec2.create_security_group(GroupName=sg_name, Description='Portfolio DB SG')
            sg_id = sg['GroupId']
            ec2.authorize_security_group_ingress(GroupId=sg_id, IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 5432, 'ToPort': 5432, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ])
        except ClientError:
            sgs = ec2.describe_security_groups(GroupNames=[sg_name])
            sg_id = sgs['SecurityGroups'][0]['GroupId']

        # 2. Launch Instance (t3.micro is Free Tier)
        instances = ec2.run_instances(
            ImageId='ami-0c101f26f147fa7fd', # Amazon Linux 2023 x86_64
            InstanceType='t3.micro',
            MinCount=1, MaxCount=1, SecurityGroupIds=[sg_id], UserData=user_data,
            TagSpecifications=[{'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': 'portfolio-db-cheap'}]}]
        )

        instance_id = instances['Instances'][0]['InstanceId']
        print(f"✅ Instance launched: {instance_id}")

        while True:
            desc = ec2.describe_instances(InstanceIds=[instance_id])
            inst = desc['Reservations'][0]['Instances'][0]
            if 'PublicIpAddress' in inst:
                ip = inst['PublicIpAddress']
                print(f"✅ Public IP: {ip}")

                print("📝 Updating your config files with the new IP...")
                new_url = f"postgresql://postgres:{password}@{ip}:5432/portfolio_db"

                # Update .env.local
                update_file('.env.local', r'DATABASE_URL=.*', f'DATABASE_URL={new_url}')

                # Update new3.sh
                update_file('new3.sh', r'EC2_HOST=".*"', f'EC2_HOST="{ip}"')
                update_file('new3.sh', r'EC2_IP=".*"', f'EC2_IP="{ip}"')

                return ip
            time.sleep(5)

    except Exception as e:
        print(f"❌ Failed: {e}")
        return None

if __name__ == "__main__":
    ip = setup_optimized_ec2()
    if ip:
        print(f"\n✅ SETUP COMPLETE.")
        print(f"⏳ Please wait ~2 minutes for PostgreSQL to finish installing on the server.")
        print(f"🚀 Then run: /bin/zsh new3.sh")
