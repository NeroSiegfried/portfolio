#!/usr/bin/env python3
"""
Apply the media lifecycle policy to an EXISTING bucket (no full re-setup).

Usage:
    python3 aws/apply-lifecycle.py [bucket-name]

Bucket resolution: CLI arg → $AWS_S3_BUCKET → $S3_BUCKET.

SAFE ORDERING (important — do these in order):
  1. Attach the wider IAM policy first (aws/iam-uploader-policy.json) so the app
     can tag/list/delete. Until s3:PutObjectTagging is granted, NEW uploads 403.
  2. Run the reconciliation sweep once so every currently-referenced image is
     tagged keep=true and existing orphans are cleaned:
         curl -X POST https://<site>/api/admin/media/sweep \
              -H "Authorization: Bearer $CRON_SECRET"
     (or POST it while logged in as admin). This is the backfill.
  3. THEN run this script. Applying the rule before the backfill is still safe —
     untagged objects are NOT matched (the rule matches keep=false only) — but
     running the sweep first guarantees referenced images are keep=true.
"""

import os
import sys
import boto3
from lifecycle_config import MEDIA_LIFECYCLE, GRACE_DAYS


def main() -> int:
    bucket = (
        (sys.argv[1] if len(sys.argv) > 1 else None)
        or os.environ.get("AWS_S3_BUCKET")
        or os.environ.get("S3_BUCKET")
    )
    if not bucket:
        print("❌ No bucket given. Pass it as an argument or set AWS_S3_BUCKET.")
        return 1

    region = os.environ.get("AWS_S3_REGION") or os.environ.get("S3_REGION") or "us-east-1"
    s3 = boto3.client("s3", region_name=region)

    print(f"Applying media lifecycle to s3://{bucket} ({region}) …")
    s3.put_bucket_lifecycle_configuration(Bucket=bucket, LifecycleConfiguration=MEDIA_LIFECYCLE)
    print(f"✓ Applied {len(MEDIA_LIFECYCLE['Rules'])} rules "
          f"(uploads/ keep=false expire after {GRACE_DAYS}d; version + multipart cleanup).")

    # Echo back what S3 now reports so you can eyeball it.
    current = s3.get_bucket_lifecycle_configuration(Bucket=bucket)
    for rule in current.get("Rules", []):
        print(f"   • {rule.get('ID')}: {rule.get('Status')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
