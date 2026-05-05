#!/usr/bin/env python3

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-path")
    parser.add_argument("--stdin", action="store_true")
    parser.add_argument("--format", default="txt")
    parser.add_argument("--name", default="document.txt")
    args = parser.parse_args()

    if not args.input_path and not args.stdin:
        raise SystemExit("Provide --input-path or --stdin")

    from docling.document_converter import DocumentConverter

    cleanup_path = None
    source_path = args.input_path

    if args.stdin:
        suffix = f".{args.format.lstrip('.')}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as handle:
            handle.write(sys.stdin.buffer.read())
            cleanup_path = handle.name
            source_path = cleanup_path

    try:
        converter = DocumentConverter()
        result = converter.convert(source_path)
        document = result.document
        markdown = document.export_to_markdown()
        plain_text = document.export_to_text()
        raw = document.export_to_dict()

        payload = {
            "provider": "docling_local",
            "markdown": markdown,
            "text": plain_text,
            "sections": extract_sections(markdown or plain_text),
            "tables_count": len(raw.get("tables", [])),
            "pictures_count": len(raw.get("pictures", [])),
            "raw_document": raw,
        }

        sys.stdout.write(json.dumps(payload))
    finally:
        if cleanup_path and Path(cleanup_path).exists():
            os.unlink(cleanup_path)

    return 0


def extract_sections(content: str):
    sections = []

    heading_matches = list(
        re.finditer(r"^(#{1,6}\s+.+|Clausula\s+\d+\s*[-–—]\s+.+|Cláusula\s+\d+\s*[-–—]\s+.+)$", content, flags=re.MULTILINE)
    )

    if not heading_matches:
        return [{"title": "Corpo do documento", "text": content.strip()}]

    for index, match in enumerate(heading_matches):
        start = match.start()
        end = heading_matches[index + 1].start() if index + 1 < len(heading_matches) else len(content)
        title = match.group(0).strip()
        text = content[start:end].strip()
        sections.append({"title": title, "text": text})

    return sections


if __name__ == "__main__":
    raise SystemExit(main())
