#!/usr/bin/env bash
# Add a new artwork image and its metadata
#
# Usage: gallery/gallery-add.sh path/to/image.png
#
# Creates:
# 	media/Artwork/<name>.avif
# 	media/Artwork/<name>.avif.cfg

# Then rebuilds gallery/art-database.json

set -euo pipefail

if [ "$#" -ne 1 ]; then
	echo "Usage: $0 <image>" >&2
	exit 1
fi

src=$1
if [ ! -f "$src" ]; then
	echo "Not a file: $src" >&2
	exit 1
fi

root=$(cd "$(dirname "$0")/.." && pwd)
art_dir="$root/media/Artwork"
base=$(basename "$src")
stem=${base%.*}
out="$art_dir/$stem.avif"
cfg="$out.cfg"

if [ -e "$out" ]; then
	echo "Already exists: $out" >&2
	exit 1
fi
if [ -e "$cfg" ]; then
	echo "Already exists: $cfg" >&2
	exit 1
fi

mkdir -p "$art_dir"

case "${src,,}" in
	*.avif)
		cp "$src" "$out"
		;;
	*)
		avif --input "$src" --output "$art_dir"
		;;
esac

if [ ! -f "$out" ]; then
	echo "Conversion fucked up: $out" >&2
	exit 1
fi

cat > "$cfg" <<EOF
[Image]
title = $stem
date = $(date +%F)
description =
characters =
tags =
credit = raidev.eu
source = https://raidev.eu
EOF

python3 "$root/scripts/build-gallery.py"

echo
echo "Created:"
echo "  $out"
echo "  $cfg"
echo
echo "Don't forget to setup the metadata!"
