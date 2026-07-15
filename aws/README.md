# AWS Migration Files

This directory contains all scripts and configuration for migrating your portfolio from local JSON storage to AWS cloud infrastructure.

## Files Overview

### Setup Scripts (Start Here)

**`setup.sh`** - Main setup orchestrator
- Run this first: `bash setup.sh`
- Installs dependencies and runs the Python setup script
- No arguments needed

**`setup-aws.py`** - Automated AWS resource creation
- Creates RDS Aurora PostgreSQL cluster
- Creates S3 bucket with versioning
- Creates CloudFront distribution
- Outputs configuration to `aws/aws-config.txt`
- Run via: `python3 setup-aws.py`

### Database Files

**`postgres-schema.sql`** - PostgreSQL table definitions
- 8 main tables: users, sessions, series, posts, snippets, comments, comment_votes, post_votes
- All relationships and constraints
- Indexes for common queries
- Run after RDS is created: `psql < postgres-schema.sql`

**`migrate-to-postgres.ts`** - JSON → SQL export tool
- Exports current `data/blog-db.json` to SQL INSERT statements
- Creates `data-export.sql` file
- Run: `npx ts-node migrate-to-postgres.ts`

### Application Code

**`db-postgres.ts`** (in `lib/blog/`)
- PostgreSQL client library
- Connection pooling with `pg` package
- Replaces file-based `readDb()` with async `getDb()`
- Upsert functions for all entities
- Reference for updating `lib/blog/store.ts`

### Documentation

**`../AWS_SETUP_QUICK_START.md`** - 3-step quick start guide
- For impatient people (you know who you are)
- Step-by-step with commands

**`../AWS_MIGRATION_GUIDE.md`** - Comprehensive reference
- Detailed explanations
- Both AWS Console and CLI approaches
- Troubleshooting section
- Cost optimization tips

**`../SESSION_SUMMARY.md`** - What was done this session
- All changes documented
- Next steps for you

## Quick Start

```bash
# 1. Run setup (creates everything on AWS)
bash setup.sh

# 2. Export your data
npx ts-node migrate-to-postgres.ts

# 3. Connect and import
psql -h [RDS_ENDPOINT] -U postgres -d portfolio_db -f postgres-schema.sql
psql -h [RDS_ENDPOINT] -U postgres -d portfolio_db -f data-export.sql

# 4. Update .env.local with credentials from aws-config.txt
# 5. npm install pg @types/pg
# 6. Update lib/blog/store.ts to use db-postgres.ts
```

## What Gets Created

### AWS Resources:
- **RDS Aurora PostgreSQL** cluster (Multi-AZ HA)
- **S3 Bucket** (versioned, CORS-enabled)
- **CloudFront Distribution** (CDN)
- Security groups and networking

### Local Files:
- `aws/aws-config.txt` - Your credentials
- `aws/data-export.sql` - Your data in SQL format

## Environment Variables Needed

Already in your `.env.local`:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`

Will be added after setup:
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_CLOUDFRONT_DOMAIN` - CloudFront domain

## Troubleshooting

### "boto3 not found"
```bash
pip3 install boto3 botocore
```

### "psql command not found"
```bash
# Mac
brew install postgresql

# Linux
sudo apt install postgresql-client

# Then retry psql command
```

### RDS connection timeout
Check AWS Console → Security Groups → Inbound rules allow port 5432

### S3 upload fails
Check bucket policy and CORS settings in AWS Console

### Data didn't migrate
Check `aws/data-export.sql` file exists and has content
Verify all posts/series/comments from JSON are in the file

## File Structure

```
aws/
├── setup.sh                    # Main entry point
├── setup-aws.py               # AWS resource creation
├── setup-infrastructure.py    # Alternative setup script
├── postgres-schema.sql        # Database schema
├── migrate-to-postgres.ts     # JSON export tool
├── README.md                  # This file
└── aws-config.txt            # Generated after setup (ignore in git)

../
├── AWS_SETUP_QUICK_START.md   # Quick guide
├── AWS_MIGRATION_GUIDE.md     # Detailed guide
└── lib/blog/db-postgres.ts    # PostgreSQL client
```

## Next Steps

1. ✅ Review this README
2. 📖 Read `AWS_SETUP_QUICK_START.md`
3. 🚀 Run `bash setup.sh`
4. 📝 Follow the prompts
5. 🔌 Migrate data when RDS is ready
6. 🧪 Test locally before deploying
7. 🎉 Deploy to production

## Support

- **AWS Docs**: https://docs.aws.amazon.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Boto3 Docs**: https://boto3.amazonaws.com/v1/documentation/api/latest/
- **Next.js Guide**: https://nextjs.org/docs

Good luck! 🚀
