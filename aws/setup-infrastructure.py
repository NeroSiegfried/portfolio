#!/usr/bin/env python3
"""
AWS Infrastructure Setup for Portfolio
- RDS Aurora PostgreSQL (Multi-AZ for HA)
- S3 bucket for images
- CloudFront distribution for CDN

Cost-optimized for small to medium traffic.
"""

import boto3
import json
import sys
from datetime import datetime
from lifecycle_config import MEDIA_LIFECYCLE

def setup_rds():
    """Create RDS Aurora PostgreSQL cluster with multi-AZ HA"""
    rds = boto3.client('rds', region_name='us-east-1')
    
    print("\n🗄️  Setting up RDS Aurora PostgreSQL...")
    
    cluster_id = 'portfolio-aurora-cluster'
    db_name = 'portfolio_db'
    
    try:
        # Check if cluster exists
        try:
            rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
            print(f"✓ Cluster {cluster_id} already exists")
            return get_rds_endpoint(cluster_id)
        except rds.exceptions.DBClusterNotFoundFault:
            pass
        
        # Create Aurora PostgreSQL cluster (Multi-AZ for HA)
        response = rds.create_db_cluster(
            DBClusterIdentifier=cluster_id,
            Engine='aurora-postgresql',
            EngineVersion='15.2',
            MasterUsername='postgres',
            MasterUserPassword='GenerateAStrongPasswordHere123!',  # CHANGE THIS
            DatabaseName=db_name,
            DBSubnetGroupName='default',
            VpcSecurityGroupIds=['sg-0000000000'],  # GET FROM AWS CONSOLE
            BackupRetentionPeriod=7,
            PreferredBackupWindow='03:00-04:00',
            PreferredMaintenanceWindow='sun:04:00-sun:05:00',
            EnableIAMDatabaseAuthentication=True,
            EnableCloudwatchLogsExports=['postgresql'],
            DeletionProtection=False,
            StorageEncrypted=True,
            EnableMultiAZ=True,  # HA enabled
            Tags=[
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'Project', 'Value': 'portfolio'},
            ]
        )
        
        cluster_arn = response['DBCluster']['DBClusterArn']
        print(f"✓ Aurora cluster created: {cluster_id}")
        print(f"  ARN: {cluster_arn}")
        print(f"  ⏳ This takes 5-10 minutes...")
        
        return response['DBCluster']
        
    except Exception as e:
        print(f"❌ RDS setup failed: {e}")
        sys.exit(1)

def setup_s3():
    """Create S3 bucket for images with versioning"""
    s3 = boto3.client('s3', region_name='us-east-1')
    
    print("\n📦 Setting up S3 bucket...")
    
    bucket_name = f"portfolio-images-{datetime.now().strftime('%s')}"
    
    try:
        # Check if bucket exists
        try:
            s3.head_bucket(Bucket=bucket_name)
            print(f"✓ Bucket {bucket_name} already exists")
            return bucket_name
        except s3.exceptions.NoSuchBucket:
            pass
        
        # Create bucket
        s3.create_bucket(Bucket=bucket_name)
        print(f"✓ S3 bucket created: {bucket_name}")
        
        # Enable versioning
        s3.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={'Status': 'Enabled'}
        )
        print(f"✓ Versioning enabled")
        
        # Set public read ACL for images
        cors_config = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'PUT', 'POST'],
                    'AllowedOrigins': ['https://nerosiegfried.com', 'https://*.nerosiegfried.com', 'http://localhost:3000'],
                    'ExposeHeaders': ['ETag'],
                    'MaxAgeSeconds': 3000
                }
            ]
        }
        s3.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_config)
        print(f"✓ CORS configured for uploads")
        
        # Lifecycle policy. Uploads are PERMANENT: the app tags referenced images
        # keep=true and deletes orphans itself. The only expiry rule here is a
        # backstop that removes uploads/ objects still tagged keep=false (never
        # confirmed referenced) after a 30-day grace — orphans the app couldn't
        # find. Kept in sync with aws/apply-lifecycle.py and lib/blog/media.ts.
        s3.put_bucket_lifecycle_configuration(Bucket=bucket_name, LifecycleConfiguration=MEDIA_LIFECYCLE)
        print(f"✓ Lifecycle policy configured (keep=false uploads expire after 30d; version + multipart cleanup)")
        
        return bucket_name
        
    except Exception as e:
        print(f"❌ S3 setup failed: {e}")
        sys.exit(1)

def setup_cloudfront(bucket_name):
    """Create CloudFront distribution for S3"""
    cf = boto3.client('cloudfront', region_name='us-east-1')
    
    print("\n🚀 Setting up CloudFront CDN...")
    
    try:
        domain_name = f"{bucket_name}.s3.amazonaws.com"
        
        config = {
            'CallerReference': str(datetime.now().timestamp()),
            'Comment': 'Portfolio images CDN',
            'DefaultRootObject': '',
            'Origins': {
                'Quantity': 1,
                'Items': [
                    {
                        'Id': 'S3Origin',
                        'DomainName': domain_name,
                        'S3OriginConfig': {
                            'OriginAccessIdentity': ''  # Will use public S3
                        }
                    }
                ]
            },
            'DefaultCacheBehavior': {
                'TargetOriginId': 'S3Origin',
                'ViewerProtocolPolicy': 'redirect-to-https',
                'CachePolicyId': '658327ea-f89d-4fab-a63d-7e88639e58f6',  # Managed cache policy
                'Compress': True,
                'ForwardedValues': {
                    'QueryString': False,
                    'Cookies': {'Forward': 'none'},
                    'Headers': {
                        'Quantity': 0
                    }
                }
            },
            'Enabled': True,
            'PriceClass': 'PriceClass_100',  # USA + Europe (cheapest option)
        }
        
        response = cf.create_distribution(DistributionConfig=config)
        dist_id = response['Distribution']['Id']
        domain = response['Distribution']['DomainName']
        
        print(f"✓ CloudFront distribution created")
        print(f"  Distribution ID: {dist_id}")
        print(f"  Domain: {domain}")
        print(f"  ⏳ Deployment takes 15-20 minutes...")
        
        return {
            'distribution_id': dist_id,
            'domain': domain
        }
        
    except Exception as e:
        print(f"❌ CloudFront setup failed: {e}")
        sys.exit(1)

def get_rds_endpoint(cluster_id):
    """Get RDS cluster endpoint"""
    rds = boto3.client('rds', region_name='us-east-1')
    try:
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        endpoint = cluster['Endpoint']
        port = cluster['Port']
        return {
            'endpoint': endpoint,
            'port': port,
            'arn': cluster['DBClusterArn']
        }
    except:
        return None

def main():
    print("=" * 70)
    print("AWS INFRASTRUCTURE SETUP FOR PORTFOLIO")
    print("=" * 70)
    
    # Setup services
    rds_info = setup_rds()
    bucket = setup_s3()
    cloudfront = setup_cloudfront(bucket)
    
    # Generate .env updates
    print("\n" + "=" * 70)
    print("✅ SETUP COMPLETE - ADD TO .env.local:")
    print("=" * 70)
    
    env_updates = f"""
# PostgreSQL
DATABASE_URL=postgresql://postgres:PASSWORD@{rds_info.get('endpoint', 'YOUR_RDS_ENDPOINT')}:5432/portfolio_db

# S3 & CloudFront
AWS_S3_BUCKET={bucket}
AWS_CLOUDFRONT_DOMAIN={cloudfront.get('domain', 'YOUR_CLOUDFRONT_DOMAIN')}
AWS_S3_REGION=us-east-1
"""
    
    print(env_updates)
    
    print("\nNext steps:")
    print("1. Update DATABASE_URL with actual RDS endpoint (wait for cluster creation)")
    print("2. Update S3 bucket policy for public read access")
    print("3. Run: npx ts-node aws/migrate-to-postgres.ts")
    print("4. Apply sql/data-export.sql to RDS database")
    print("5. Update lib/blog/store.ts to use PostgreSQL")

if __name__ == '__main__':
    main()
