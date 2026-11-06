#!/usr/bin/env python3
"""
Build gallery/art-database.json from the per-image .cfg files
"""

import configparser
import json
import struct
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ART_DIR = ROOT / "media" / "Artwork"
TAGS_FILE = ROOT / "gallery" / "tags.ini"
OUT_FILE = ROOT / "gallery" / "art-database.json"

KNOWN_KEYS = {
    "title",
    "description",
    "date",
    "characters",
    "tags",
    "credit",
    "source",
}


def split_list(value):
    if not value:
        return []
    return [item.strip() for item in value.replace(";", ",").split(",") if item.strip()]


def unique(items):
    return list(dict.fromkeys(items))


def parse_bool(value, default=False):
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def clean_value(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value


def load_tags(path):
    parser = configparser.ConfigParser(interpolation=None)
    try:
        with path.open(encoding="utf-8") as handle:
            parser.read_file(handle)
    except configparser.Error as error:
        raise SystemExit(f"Invalid INI {path}:\n{error}")

    tags = []
    for section in parser.sections():
        def get(key, fallback=""):
            return clean_value(parser.get(section, key, fallback=fallback))

        tags.append({
            "name": section,
            "title": get("title", section),
            "icon": get("icon", ""),
            "kind": get("kind", "category"),
            "visible": parse_bool(get("visible", "true")),
            "exclusive": parse_bool(get("exclusive", "false")),
            "exclude": split_list(get("exclude", "")),
        })

    return tags


def iter_boxes(data, start=0, end=None):
    if end is None:
        end = len(data)

    position = start
    while position + 8 <= end:
        size, box_type = struct.unpack(">I4s", data[position:position + 8])
        header = 8

        if size == 1:
            if position + 16 > end:
                break
            size = struct.unpack(">Q", data[position + 8:position + 16])[0]
            header = 16
        elif size == 0:
            size = end - position

        if size < header or position + size > end:
            break

        yield position, size, box_type, header
        position += size


def find_ispe(data, start=0, end=None):
    found = []

    for position, size, box_type, header in iter_boxes(data, start, end):
        body = position + header

        if box_type == b"ispe":
            if body + 12 <= position + size:
                width, height = struct.unpack(">II", data[body + 4:body + 12])
                if width and height:
                    found.append((width, height))
        elif box_type == b"meta":
            found.extend(find_ispe(data, body + 4, position + size))
        elif box_type in (b"iprp", b"ipco"):
            found.extend(find_ispe(data, body, position + size))

    return found


def read_avif_dimensions(path):
    with path.open("rb") as handle:
        data = handle.read(65536)

    found = find_ispe(data)
    if not found:
        with path.open("rb") as handle:
            data = handle.read()
        found = find_ispe(data)

    if not found:
        raise SystemExit(f"Could not read dimensions from {path}")

    return found[0]


def read_config(path):
    parser = configparser.ConfigParser(interpolation=None)
    try:
        with path.open(encoding="utf-8") as handle:
            parser.read_file(handle)
    except configparser.Error as error:
        raise SystemExit(f"Invalid INI {path}:\n{error}")

    if not parser.has_section("Image"):
        raise SystemExit(f"Missing [Image] section: {path}")

    return parser


def main():
    tag_definitions = load_tags(TAGS_FILE)
    known_tags = {tag["name"] for tag in tag_definitions if tag.get("name")}

    artwork = []
    warnings = []
    seen_configs = set()

    for image_path in sorted(ART_DIR.glob("*.avif")):
        cfg_path = image_path.with_name(image_path.name + ".cfg")

        if not cfg_path.exists():
            warnings.append(f"No config, skipping {image_path.name}")
            continue

        seen_configs.add(cfg_path)
        parser = read_config(cfg_path)

        for key in sorted(set(parser.options("Image")) - KNOWN_KEYS):
            warnings.append(f'Unknown key "{key}" in {cfg_path}')

        title = clean_value(parser.get("Image", "title", fallback=""))
        if not title:
            raise SystemExit(f"Missing title: {cfg_path}")

        date = clean_value(parser.get("Image", "date", fallback=""))
        try:
            date = datetime.strptime(date, "%Y-%m-%d").strftime("%Y-%m-%d")
        except ValueError:
            raise SystemExit(
                f"Invalid date (expected YYYY-MM-DD): {cfg_path}"
            )

        characters = unique(
            split_list(clean_value(parser.get("Image", "characters", fallback="")))
        )
        tags = unique(
            characters
            + split_list(clean_value(parser.get("Image", "tags", fallback="")))
        )

        for tag in tags:
            if tag not in known_tags:
                raise SystemExit(f'Unknown tag "{tag}" in {cfg_path}')

        width, height = read_avif_dimensions(image_path)

        entry = {
            "filename": image_path.stem,
            "title": title,
            "date": date,
            "tags": tags,
            "characters": characters,
            "width": width,
            "height": height,
            "credit": clean_value(parser.get("Image", "credit", fallback=""))
            or "raidev.eu",
            "source": clean_value(parser.get("Image", "source", fallback=""))
            or "https://raidev.eu",
        }

        description = clean_value(parser.get("Image", "description", fallback=""))
        if description:
            entry["description"] = description

        artwork.append(entry)

    for cfg_path in sorted(ART_DIR.glob("*.avif.cfg")):
        if cfg_path not in seen_configs:
            warnings.append(f"config has no image: {cfg_path.name}")

    artwork.sort(
        key=lambda item: (
            -datetime.strptime(item["date"], "%Y-%m-%d").toordinal(),
            item["filename"],
        )
    )

    output = {
        "tags": tag_definitions,
        "artwork": artwork,
    }

    OUT_FILE.write_text(
        json.dumps(output, indent="\t", ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(artwork)} artwork entries to {OUT_FILE.relative_to(ROOT)}")
    for warning in warnings:
        print(f"Warning: {warning}", file=sys.stderr)


if __name__ == "__main__":
    main()
