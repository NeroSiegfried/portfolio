# AWS Migration Plan — Portfolio / Blog

## Overview

This document covers containerising the Next.js app and deploying it to AWS using **App Runner** (simplest) or **ECS Fargate** (more control). Both options are serverless — no EC2 to manage.

---

## 1. Dockerfile

```dockerfile
# ── Stage 1: deps ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ── Stage 3: runner ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public         ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static  ./.next/static

# Blog DB persists at /data/blog-db.json — mount an EFS volume here in prod
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> **Note**: Add `output: "standalone"` to `next.config.mjs` to enable the slim `server.js`.

---

## 2. docker-compose.yml (local dev parity)

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BLOG_ADMIN_EMAIL=${BLOG_ADMIN_EMAIL}
      - BLOG_ADMIN_PASSWORD=${BLOG_ADMIN_PASSWORD}
      - NEXT_PUBLIC_ADMIN_ENTRY_PATH=${NEXT_PUBLIC_ADMIN_ENTRY_PATH}
    volumes:
      - blog_data:/data
volumes:
  blog_data:
```

---

## 3. Build & Push to Amazon ECR

```bash
# One-time setup
aws ecr create-repository --repository-name portfolio --region us-east-1

# Authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build & tag
docker build -t portfolio .
docker tag portfolio:latest \
  <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest

# Push
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest
```

---

## 4a. Deploy with AWS App Runner (recommended for solo projects)

App Runner is the simplest path: pulls from ECR, handles TLS, auto-scales to zero.

```bash
aws apprunner create-service \
  --service-name portfolio \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "BLOG_ADMIN_EMAIL": "{{resolve:secretsmanager:portfolio/admin:SecretString:email}}",
          "BLOG_ADMIN_PASSWORD": "{{resolve:secretsmanager:portfolio/admin:SecretString:password}}",
          "NEXT_PUBLIC_ADMIN_ENTRY_PATH": "/control"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{"Cpu": "0.25 vCPU", "Memory": "0.5 GB"}'
```

> App Runner automatically provisions a TLS cert and a `*.awsapprunner.com` domain. Point your custom domain via **App Runner → Custom domains → Associate domain**.

### Persistent blog DB

The flat-file `data/blog-db.json` is not suitable for a multi-container setup. Options:

| Option | Effort | Cost |
|--------|--------|------|
| **Amazon EFS** mounted into the container (single instance only) | Low | ~$0.30/GB/month |
| Migrate to **DynamoDB** (replace `store.ts` with AWS SDK calls) | Medium | Pay-per-request, effectively free at low scale |
| **SQLite on EFS** with `better-sqlite3` | Low–Medium | Same as EFS |

For a portfolio blog, **EFS is the quick win** — mount at `/data`, update `DATA_PATH` env var to `/data/blog-db.json`.

---

## 4b. Deploy with ECS Fargate (more control)

Use when you need VPC networking, ALB, or multiple services.

```bash
# Create cluster
aws ecs create-cluster --cluster-name portfolio

# Register task definition (see task-definition.json below)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster portfolio \
  --service-name portfolio-web \
  --task-definition portfolio:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**task-definition.json** (key fields):
```json
{
  "family": "portfolio",
  "cpu": "256",
  "memory": "512",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "containerDefinitions": [{
    "name": "web",
    "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest",
    "portMappings": [{ "containerPort": 3000 }],
    "secrets": [
      { "name": "BLOG_ADMIN_EMAIL",    "valueFrom": "arn:aws:secretsmanager:...:portfolio/admin:email::" },
      { "name": "BLOG_ADMIN_PASSWORD", "valueFrom": "arn:aws:secretsmanager:...:portfolio/admin:password::" }
    ],
    "mountPoints": [{ "containerPath": "/data", "sourceVolume": "blog-data" }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/portfolio",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }],
  "volumes": [{
    "name": "blog-data",
    "efsVolumeConfiguration": { "fileSystemId": "fs-xxxxxxxx" }
  }]
}
```

---

## 5. Environment Variables via Secrets Manager

```bash
aws secretsmanager create-secret \
  --name portfolio/admin \
  --secret-string '{"email":"admin@example.com","password":"change-me-please"}'
```

Reference in App Runner / ECS as shown above. Never commit secrets to the repo.

---

## 6. Custom Domain & HTTPS

1. Register / transfer domain in **Route 53** (or use an existing registrar).
2. Request a cert in **ACM** (us-east-1 for App Runner / CloudFront).
3. **App Runner**: use the *Custom domains* tab — it auto-validates via CNAME.
4. **ECS + ALB**: attach the cert to the HTTPS listener on the ALB; add an A-alias record in Route 53 pointing to the ALB.

---

## 7. CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          docker build -t portfolio .
          docker tag portfolio:latest ${{ secrets.ECR_REGISTRY }}/portfolio:latest
          docker push ${{ secrets.ECR_REGISTRY }}/portfolio:latest
      # App Runner auto-deploys on new image push if AutoDeploymentsEnabled=true
```

---

## 8. Estimated Monthly Cost

| Service | Config | Est. cost |
|---------|--------|-----------|
| App Runner | 0.25 vCPU / 0.5 GB, ~100 req/day | **~$5–10/mo** |
| ECR | < 1 GB image storage | **~$0.10/mo** |
| EFS | < 1 GB data | **~$0.30/mo** |
| Route 53 | 1 hosted zone | **$0.50/mo** |
| ACM cert | Free with App Runner / ALB | **$0** |
| **Total** | | **~$6–11/mo** |

> **Free tier** covers the first 12 months for many services. App Runner has no free tier but is cheaper than a t3.micro EC2 with comparable setup effort.

---

## 9. GCP Alternative (Cloud Run)

If you prefer GCP, Cloud Run is the equivalent of App Runner:

```bash
gcloud run deploy portfolio \
  --image gcr.io/<PROJECT>/portfolio:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars BLOG_ADMIN_EMAIL=...,BLOG_ADMIN_PASSWORD=...
```

Cost is similar; GCP has a generous free tier (2M requests/month on Cloud Run).
