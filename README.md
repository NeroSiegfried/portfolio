# Portfolio + Blog System

## 💰 AWS Cost Optimization (IMPORTANT)
This project is configured for a cost-optimized architecture (<$5/mo).

### To reduce costs:
1. **Provision EC2 DB**: Run `python3 aws/setup-optimized-ec2.py`. This replaces RDS Aurora.
2. **Update Env**: Use the new `DATABASE_URL` in `.env.local`.
3. **Cleanup**: Run `bash aws/terminate-expensive-resources.sh` to delete RDS and NAT Gateways.

---

## Environment Setup
Copy `.env.example` to `.env.local` and set:
- `DATABASE_URL`: PostgreSQL connection string.
- `AWS_S3_BUCKET`: For image storage.
- `AWS_CLOUDFRONT_DOMAIN`: CDN for images.
- `BLOG_ADMIN_EMAIL`/`PASSWORD`: Admin credentials.

## Deployment
- **Frontend**: Hosted on Vercel or AWS Amplify.
- **Database**: PostgreSQL 15 on EC2 (t3.micro).
- **Storage**: AWS S3 + CloudFront.

## Authoring
- Create snippets in the admin dashboard, then embed in posts with `{{snippet:slug}}`.
- Series support parent-child nesting for organization.

## Project Preview Image Sizes
- **Desktop (MacBook):** 16:10 ratio (e.g., 1728x1117).
- **Mobile (iPhone):** 19.5:9 ratio (e.g., 393x852).

## Hotkeys
See `docs/HOTKEYS.md`.
