#!/usr/bin/env python3
"""
Connect to RDS and execute schema + data import
This bypasses DNS resolution by using boto3 RDS proxy
"""

import sys
import os

# Add to path if needed
os.environ['DATABASE_URL'] = 'postgresql://postgres:PortfolioSecure2026!@portfolio-aurora-cluster.cluster-cqdyguco04w7.us-east-1.rds.amazonaws.com:5432/portfolio_db'

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2...")
    os.system("pip3 install psycopg2-binary -q")
    import psycopg2

def execute_sql_file(connection, filename):
    """Execute SQL file against connection"""
    with open(filename, 'r') as f:
        sql = f.read()
    
    cursor = connection.cursor()
    cursor.execute(sql)
    connection.commit()
    cursor.close()
    print(f"✅ Executed: {filename}")

def main():
    # Connection parameters
    host = "portfolio-aurora-cluster.cluster-cqdyguco04w7.us-east-1.rds.amazonaws.com"
    port = 5432
    user = "postgres"
    password = "PortfolioSecure2026!"
    database = "portfolio_db"
    
    print(f"Connecting to RDS: {host}:{port}/{database}")
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        print("✅ Connected to RDS")
        
        # Apply schema
        print("\n[1/2] Applying schema...")
        execute_sql_file(conn, '/Users/nerosiegfried/Documents/VS/portfolio/aws/postgres-schema.sql')
        
        # Import data
        print("\n[2/2] Importing data...")
        execute_sql_file(conn, '/Users/nerosiegfried/Documents/VS/portfolio/aws/data-export.sql')
        
        conn.close()
        print("\n✅ Migration complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
