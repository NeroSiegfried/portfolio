"""
AWS Lambda Function to Import Schema and Data to RDS
Upload this to AWS Lambda and execute to complete the migration

Environment Variables needed:
- RDS_HOST: portfolio-aurora-cluster.cluster-cqdyguco04w7.us-east-1.rds.amazonaws.com
- RDS_PORT: 5432
- RDS_USER: postgres
- RDS_PASSWORD: PortfolioSecure2026!
- RDS_DB: portfolio_db
"""

import json
import os
import boto3
import psycopg2

# Get S3 client to read SQL files
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """Execute RDS migration"""
    
    # RDS connection params
    host = os.environ.get('RDS_HOST', 'portfolio-aurora-cluster.cluster-cqdyguco04w7.us-east-1.rds.amazonaws.com')
    port = int(os.environ.get('RDS_PORT', 5432))
    user = os.environ.get('RDS_USER', 'postgres')
    password = os.environ.get('RDS_PASSWORD', 'PortfolioSecure2026!')
    database = os.environ.get('RDS_DB', 'portfolio_db')
    
    try:
        # Connect to RDS
        print(f"Connecting to RDS: {host}")
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        print("✅ Connected")
        
        # Read schema from event or S3
        if 'schema_sql' in event:
            schema_sql = event['schema_sql']
        else:
            # Or read from S3
            response = s3.get_object(Bucket='portfolio-bucket', Key='postgres-schema.sql')
            schema_sql = response['Body'].read().decode('utf-8')
        
        # Apply schema
        print("Applying schema...")
        cursor.execute(schema_sql)
        conn.commit()
        print("✅ Schema applied")
        
        # Read data from event or S3
        if 'data_sql' in event:
            data_sql = event['data_sql']
        else:
            response = s3.get_object(Bucket='portfolio-bucket', Key='data-export.sql')
            data_sql = response['Body'].read().decode('utf-8')
        
        # Import data
        print("Importing data...")
        cursor.execute(data_sql)
        conn.commit()
        print("✅ Data imported")
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps('Migration completed successfully!')
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Migration failed: {str(e)}')
        }
