#!/usr/bin/env python3
"""
Automated AWS Setup Script for Portfolio
Creates RDS Aurora PostgreSQL cluster and S3 bucket with CloudFront CDN
Run: python3 aws/setup-aws.py
"""

import boto3
import sys
import time
import json
from datetime import datetime
from botocore.exceptions import ClientError

def print_header(text):
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_step(num, text):
    print(f"\n[{num}] {text}")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def setup_rds(rds_client):
    """Create RDS Aurora PostgreSQL cluster"""
    print_step(1, "Creating RDS Aurora PostgreSQL Cluster...")
    
    cluster_id = 'portfolio-aurora-cluster'
    db_name = 'portfolio_db'
    master_user = 'postgres'
    master_password = input("Enter a strong master password (min 8 chars, include numbers/symbols): ").strip()
    
    if len(master_password) < 8:
        print_error("Password must be at least 8 characters")
        return None
    
    try:
        # Check if cluster already exists
        try:
            response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
            print_success(f"Cluster {cluster_id} already exists")
            return response['DBClusters'][0]
        except ClientError as e:
            if e.response['Error']['Code'] != 'DBClusterNotFoundFault':
                raise
        
        print_info("Creating Aurora cluster (this takes 5-10 minutes)...")
        
        response = rds_client.create_db_cluster(
            DBClusterIdentifier=cluster_id,
            Engine='aurora-postgresql',
            EngineVersion='15.3',
            MasterUsername=master_user,
            MasterUserPassword=master_password,
            DatabaseName=db_name,
            BackupRetentionPeriod=7,
            PreferredBackupWindow='03:00-04:00',
            PreferredMaintenanceWindow='sun:04:00-sun:05:00',
            EnableIAMDatabaseAuthentication=True,
            EnableCloudwatchLogsExports=['postgresql'],
            StorageEncrypted=True,
            Tags=[
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'Project', 'Value': 'portfolio'},
            ]
        )
        
        cluster = response['DBCluster']
        print_success(f"Aurora cluster created: {cluster_id}")
        print_info(f"Status: {cluster['Status']}")
        print_info(f"Endpoint will be: {cluster.get('Endpoint', 'pending...')}")
        
        # Wait for cluster to be available
        print_info("Waiting for cluster to become available...")
        waiter = rds_client.get_waiter('db_cluster_available')
        try:
            waiter.wait(DBClusterIdentifier=cluster_id, WaiterConfig={'Delay': 30, 'MaxAttempts': 20})
            print_success(f"Cluster is now available!")
        except Exception as e:
            print_error(f"Timeout waiting for cluster: {e}")
            print_info("You can check status in AWS Console or run: aws rds describe-db-clusters")
        
        # Get updated cluster info
        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        return response['DBClusters'][0]
        
    except ClientError as e:
        print_error(f"RDS setup failed: {e}")
        return None

def setup_s3(s3_client):
    """Create S3 bucket with versioning and lifecycle"""
    print_step(2, "Creating S3 Bucket...")
    
    bucket_name = f"portfolio-images-{datetime.now().strftime('%s')}"
    
    try:
        # Check if bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            print_success(f"Bucket already exists: {bucket_name}")
            return bucket_name
        except ClientError as e:
            if e.response['Error']['Code'] != '404':
                raise
        
        # Create bucket
        s3_client.create_bucket(Bucket=bucket_name)
        print_success(f"S3 bucket created: {bucket_name}")
        
        # Enable versioning
        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={'Status': 'Enabled'}
        )
        print_success("Versioning enabled")
        
        # Set CORS
        cors = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'PUT', 'POST'],
                    'AllowedOrigins': ['https://nerosiegfried.com', 'http://localhost:3000'],
                    'ExposeHeaders': ['ETag'],
                    'MaxAgeSeconds': 3000
                }
            ]
        }
        s3_client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors)
        print_success("CORS configured")
        
        # Set lifecycle policy
        lifecycle = {
            'Rules': [
                {
                    'Id': 'DeleteOldVersions',
                    'Status': 'Enabled',
                    'NoncurrentVersionExpirationInDays': 30
                }
            ]
        }
        s3_client.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle
        )
        print_success("Lifecycle policy set (delete old versions after 30 days)")
        
        return bucket_name
        
    except ClientError as e:
        print_error(f"S3 setup failed: {e}")
        return None

def setup_cloudfront(cf_client, bucket_name):
    """Create CloudFront distribution"""
    print_step(3, "Creating CloudFront Distribution...")
    
    try:
        domain_name = f"{bucket_name}.s3.us-east-1.amazonaws.com"
        
        config = {
            'CallerReference': str(time.time()),
            'Comment': 'Portfolio images CDN',
            'Origins': {
                'Quantity': 1,
                'Items': [
                    {
                        'Id': 'S3Origin',
                        'DomainName': domain_name,
                        'S3OriginConfig': {'OriginAccessIdentity': ''}
                    }
                ]
            },
            'DefaultCacheBehavior': {
                'TargetOriginId': 'S3Origin',
                'ViewerProtocolPolicy': 'redirect-to-https',
                'TrustedSigners': {'Enabled': False, 'Quantity': 0},
                'ForwardedValues': {
                    'QueryString': False,
                    'Cookies': {'Forward': 'none'},
                },
                'MinTTL': 0,
                'DefaultTTL': 86400,
                'MaxTTL': 2592000,
                'Compress': True,
            },
            'CacheBehaviors': [],
            'Enabled': True,
            'PriceClass': 'PriceClass_100',
        }
        
        response = cf_client.create_distribution(DistributionConfig=config)
        dist = response['Distribution']
        
        print_success(f"CloudFront distribution created")
        print_info(f"Distribution ID: {dist['Id']}")
        print_info(f"Domain: {dist['DomainName']}")
        print_info("(takes 15-20 minutes to deploy)")
        
        return {
            'id': dist['Id'],
            'domain': dist['DomainName']
        }
        
    except ClientError as e:
        print_error(f"CloudFront setup failed: {e}")
        return None

def main():
    print_header("AWS PORTFOLIO INFRASTRUCTURE SETUP")
    print("This script will create:")
    print("  - RDS Aurora PostgreSQL cluster (Multi-AZ HA)")
    print("  - S3 bucket for images")
    print("  - CloudFront CDN distribution")
    print_info("Estimated cost: $50-160/month (depending on traffic)")
    
    # Initialize AWS clients
    try:
        rds = boto3.client('rds', region_name='us-east-1')
        s3 = boto3.client('s3', region_name='us-east-1')
        cf = boto3.client('cloudfront', region_name='us-east-1')
    except Exception as e:
        print_error(f"Failed to initialize AWS clients: {e}")
        print_info("Make sure AWS credentials are configured:")
        print_info("  export AWS_ACCESS_KEY_ID=...")
        print_info("  export AWS_SECRET_ACCESS_KEY=...")
        sys.exit(1)
    
    # Setup infrastructure
    rds_cluster = setup_rds(rds)
    if not rds_cluster:
        sys.exit(1)
    
    s3_bucket = setup_s3(s3)
    if not s3_bucket:
        sys.exit(1)
    
    cf_dist = setup_cloudfront(cf, s3_bucket)
    if not cf_dist:
        sys.exit(1)
    
    # Generate environment variables
    print_header("✅ SETUP COMPLETE!")
    
    rds_endpoint = rds_cluster.get('Endpoint', 'pending-check-console')
    rds_port = rds_cluster.get('Port', 5432)
    
    env_content = f"""
# Add these to .env.local:

# Database (update password with what you entered)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@{rds_endpoint}:{rds_port}/portfolio_db

# S3 & CloudFront
AWS_S3_BUCKET={s3_bucket}
AWS_CLOUDFRONT_DOMAIN={cf_dist['domain']}
AWS_S3_REGION=us-east-1
"""
    
    print(env_content)
    
    # Save to file
    config_file = 'aws/aws-config.txt'
    with open(config_file, 'w') as f:
        f.write(env_content)
    
    print_success(f"Configuration saved to {config_file}")
    
    print_info("Next steps:")
    print("  1. Update DATABASE_URL with your master password")
    print("  2. Wait for RDS cluster to be available (check AWS Console)")
    print("  3. Run: npx ts-node aws/migrate-to-postgres.ts")
    print("  4. Apply: psql < aws/postgres-schema.sql")
    print("  5. Apply: psql < aws/data-export.sql")

if __name__ == '__main__':
    main()
