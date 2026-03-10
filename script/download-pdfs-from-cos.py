"""
Download PDF files from Tencent COS bucket by book ID.

Usage:
    pip install cos-python-sdk-v5
    python script/download-pdfs-from-cos.py
"""

import os
import sys
from qcloud_cos import CosConfig, CosS3Client

# COS Configuration
SECRET_ID = os.environ.get("COS_SECRET_ID", "IKIDiS2VouoW4QZVIsFVZTlrsmbGk18B5mJd")
SECRET_KEY = os.environ.get("COS_SECRET_KEY", "CBwXw88A3kEVdYHn9JG0Xv76by86rQp2")
REGION = os.environ.get("COS_REGION", "ap-jakarta")
BUCKET = os.environ.get("COS_BUCKET", "pewacaold-1379748683")

# COS prefix where PDFs are stored
PDF_PREFIX = "pdf/"

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "downloaded_pdfs")

# Book IDs to download
BOOK_IDS = [
    2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 22, 23, 24, 25, 26,
    27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 44, 75, 102, 106, 109, 111,
    117, 119, 121, 125, 130, 131, 132, 135, 136, 137, 141, 142, 143, 144, 145,
    146, 151, 152, 155, 156, 159, 163, 169, 172, 174, 175, 177, 180, 181, 182,
    184, 186, 188, 189, 190, 191, 192, 193, 194, 197, 200, 203, 206, 209, 212,
    213, 214, 218, 245, 251, 265, 266, 269, 315, 331, 334, 355, 366, 385, 390,
    394, 413, 435, 436, 459, 480, 484, 507, 774, 1172,
]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    config = CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY)
    client = CosS3Client(config)

    # List all PDF files in the bucket
    print(f"📂 Listing files in COS bucket: {BUCKET}/{PDF_PREFIX}")
    all_pdfs = []
    marker = ""
    while True:
        resp = client.list_objects(Bucket=BUCKET, Prefix=PDF_PREFIX, Marker=marker, MaxKeys=1000)
        contents = resp.get("Contents", [])
        all_pdfs.extend(contents)
        if resp.get("IsTruncated") == "true":
            marker = resp["NextMarker"]
        else:
            break

    print(f"   Found {len(all_pdfs)} total files in {PDF_PREFIX}\n")

    # Build lookup: extract leading number from filename
    # Expected format: pdf/123_Some Title.pdf or pdf/123.pdf
    cos_file_map = {}
    for item in all_pdfs:
        key = item["Key"]  # e.g. "pdf/123_Book Title.pdf"
        filename = key[len(PDF_PREFIX):]  # e.g. "123_Book Title.pdf"
        # Extract leading number
        num_str = ""
        for ch in filename:
            if ch.isdigit():
                num_str += ch
            else:
                break
        if num_str:
            book_id = int(num_str)
            cos_file_map[book_id] = key

    # Download matching files
    downloaded = 0
    not_found = []

    for book_id in BOOK_IDS:
        if book_id in cos_file_map:
            cos_key = cos_file_map[book_id]
            filename = os.path.basename(cos_key)
            local_path = os.path.join(OUTPUT_DIR, filename)

            if os.path.exists(local_path):
                print(f"⏭️  [{book_id}] Already exists: {filename}")
                downloaded += 1
                continue

            print(f"⬇️  [{book_id}] Downloading: {cos_key}")
            try:
                client.download_file(Bucket=BUCKET, Key=cos_key, DestFilePath=local_path)
                size_mb = os.path.getsize(local_path) / (1024 * 1024)
                print(f"   ✅ Saved: {filename} ({size_mb:.1f} MB)")
                downloaded += 1
            except Exception as e:
                print(f"   ❌ Failed: {e}")
        else:
            not_found.append(book_id)
            print(f"⚠️  [{book_id}] Not found in COS")

    print(f"\n{'='*50}")
    print(f"📊 Results:")
    print(f"   Downloaded: {downloaded}/{len(BOOK_IDS)}")
    print(f"   Not found:  {len(not_found)}")
    if not_found:
        print(f"   Missing IDs: {not_found}")
    print(f"   Output dir:  {os.path.abspath(OUTPUT_DIR)}")


if __name__ == "__main__":
    main()
