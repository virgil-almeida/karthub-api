#!/usr/bin/env python
"""
Script de migração de storage: Supabase → S3 / MinIO (Fase 3).

Copia arquivos dos buckets do Supabase para o storage configurado no Django.
Executa fora do manage.py para poder ser usado antes do banco Django estar pronto.

Uso:
  python scripts/migrate_storage.py \\
      --supabase-url  https://xxx.supabase.co \\
      --supabase-key  <service_role_key> \\
      --target        s3|minio|local \\
      [--bucket       avatars,championship-logos,badge-images] \\
      [--s3-bucket    karthub] \\
      [--s3-endpoint  http://localhost:9000] \\
      [--s3-key       minioadmin] \\
      [--s3-secret    minioadmin] \\
      [--local-dir    /tmp/karthub-storage] \\
      [--dry-run]
"""

import argparse
import io
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

SUPABASE_BUCKETS = ["avatars", "championship-logos", "badge-images"]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Migra storage do Supabase para S3/MinIO/local")
    p.add_argument("--supabase-url", required=True)
    p.add_argument("--supabase-key", required=True, help="Service role key")
    p.add_argument("--target", required=True, choices=["s3", "minio", "local"])
    p.add_argument("--bucket", default=",".join(SUPABASE_BUCKETS), help="Buckets separados por vírgula")
    p.add_argument("--s3-bucket", default="karthub")
    p.add_argument("--s3-endpoint", default=None, help="Endpoint custom (MinIO)")
    p.add_argument("--s3-key", default=None)
    p.add_argument("--s3-secret", default=None)
    p.add_argument("--s3-region", default="us-east-1")
    p.add_argument("--local-dir", default="/tmp/karthub-storage")
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def supabase_headers(key: str) -> dict[str, str]:
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def list_bucket_files(base_url: str, key: str, bucket: str) -> list[dict]:
    """Lista todos os arquivos de um bucket via Storage API."""
    url = f"{base_url}/storage/v1/object/list/{bucket}"
    payload = json.dumps({"limit": 10000, "offset": 0, "prefix": ""}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={**supabase_headers(key), "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        print(f"  Erro ao listar {bucket}: {exc.code} {exc.read().decode()}", file=sys.stderr)
        return []


def download_file(base_url: str, key: str, bucket: str, path: str) -> bytes | None:
    url = f"{base_url}/storage/v1/object/{bucket}/{path}"
    req = urllib.request.Request(url, headers=supabase_headers(key))
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        print(f"  Erro ao baixar {bucket}/{path}: {exc.code}", file=sys.stderr)
        return None


def upload_s3(
    data: bytes,
    key_path: str,
    s3_bucket: str,
    s3_key: str,
    s3_secret: str,
    s3_region: str,
    s3_endpoint: str | None,
) -> bool:
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError
    except ImportError:
        print("boto3 não instalado. Instale com: pip install boto3", file=sys.stderr)
        sys.exit(1)

    kwargs: dict = {
        "aws_access_key_id": s3_key,
        "aws_secret_access_key": s3_secret,
        "region_name": s3_region,
    }
    if s3_endpoint:
        kwargs["endpoint_url"] = s3_endpoint

    client = boto3.client("s3", **kwargs)
    try:
        client.put_object(Bucket=s3_bucket, Key=key_path, Body=data)
        return True
    except (BotoCoreError, ClientError) as exc:
        print(f"  Erro no upload S3 de {key_path}: {exc}", file=sys.stderr)
        return False


def save_local(data: bytes, local_dir: str, bucket: str, path: str) -> bool:
    dest = Path(local_dir) / bucket / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def migrate_bucket(args: argparse.Namespace, bucket: str) -> tuple[int, int, int]:
    print(f"\n[{bucket}]")
    files = list_bucket_files(args.supabase_url, args.supabase_key, bucket)
    # Filtra apenas arquivos (não diretórios)
    files = [f for f in files if f.get("id") and not f["name"].endswith("/")]

    ok = skipped = errors = 0

    for f in files:
        path = f["name"]
        dest_key = f"{bucket}/{path}"

        if args.dry_run:
            print(f"  [dry-run] {dest_key}")
            ok += 1
            continue

        data = download_file(args.supabase_url, args.supabase_key, bucket, path)
        if data is None:
            errors += 1
            continue

        success = False
        if args.target in ("s3", "minio"):
            success = upload_s3(
                data,
                dest_key,
                args.s3_bucket,
                args.s3_key or "",
                args.s3_secret or "",
                args.s3_region,
                args.s3_endpoint,
            )
        else:
            success = save_local(data, args.local_dir, bucket, path)

        if success:
            print(f"  ✓ {dest_key}")
            ok += 1
        else:
            errors += 1

    return ok, skipped, errors


def main() -> None:
    args = parse_args()
    args.supabase_url = args.supabase_url.rstrip("/")
    buckets = [b.strip() for b in args.bucket.split(",") if b.strip()]

    if args.dry_run:
        print("⚠  Modo dry-run: nenhum arquivo será copiado.\n")

    total_ok = total_errors = 0

    for bucket in buckets:
        ok, _, errors = migrate_bucket(args, bucket)
        total_ok += ok
        total_errors += errors

    print(f"\n{'─' * 40}")
    print(f"Concluído: {total_ok} arquivos copiados, {total_errors} erros.")

    if total_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
