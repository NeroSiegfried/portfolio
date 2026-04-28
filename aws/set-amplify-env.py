import subprocess, json

env_vars = {
  "BLOG_ADMIN_EMAIL": "admin@example.com",
  "BLOG_ADMIN_PASSWORD": "change-me-please",
  "NEXT_PUBLIC_ADMIN_ENTRY_PATH": "/control",
  "DATABASE_URL": "postgresql://postgres:PortfolioSecure2026!@portfolio-db.cqdyguco04w7.us-east-1.rds.amazonaws.com:5432/portfolio_db",
  "S3_BUCKET": "portfolio-images-1777388561",
  "CLOUDFRONT_DOMAIN": "d2ukq6p6guyuw1.cloudfront.net",
  "S3_REGION": "us-east-1",
  "NODE_ENV": "production"
}

result = subprocess.run([
  "aws", "amplify", "update-app",
  "--app-id", "d19po9xkobzzua",
  "--environment-variables", json.dumps(env_vars),
  "--output", "json"
], capture_output=True, text=True)

if result.returncode == 0:
  data = json.loads(result.stdout)
  print("Success! App updated:", data["app"]["appId"])
else:
  print("Error:", result.stderr)
