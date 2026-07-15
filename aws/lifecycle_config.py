"""
Single source of truth for the media bucket's S3 lifecycle configuration.

Imported by setup-infrastructure.py, setup-aws.py and apply-lifecycle.py so the
rule set can never drift between "initial setup" and "apply to a live bucket".

Model: **uploads are permanent.** The app (see lib/blog/media.ts + media-sweep.ts)
tags every referenced image `keep=true` and deletes orphans it can find. These
rules only add a safety net:

  1. AbortIncompleteMultipartUploads — reclaim failed multipart PUTs after 7 days.
  2. DeleteOldVersions              — trim noncurrent versions after 30 days
                                       (bucket versioning is on).
  3. ExpireUnverifiedUploads        — the backstop: expire objects under uploads/
                                       still tagged keep=false (never confirmed
                                       referenced) 30 days after creation. Anything
                                       the app has confirmed is keep=true and is
                                       never matched here.
"""

GRACE_DAYS = 30

MEDIA_LIFECYCLE = {
    "Rules": [
        {
            "ID": "AbortIncompleteMultipartUploads",
            "Status": "Enabled",
            "Filter": {"Prefix": ""},
            "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 7},
        },
        {
            "ID": "DeleteOldVersions",
            "Status": "Enabled",
            "Filter": {"Prefix": ""},
            "NoncurrentVersionExpiration": {"NoncurrentDays": 30},
        },
        {
            "ID": "ExpireUnverifiedUploads",
            "Status": "Enabled",
            "Filter": {"And": {"Prefix": "uploads/", "Tags": [{"Key": "keep", "Value": "false"}]}},
            "Expiration": {"Days": GRACE_DAYS},
        },
    ]
}
