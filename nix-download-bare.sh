#!/bin/bash -eu

set -o pipefail

flake_ref="$1"
result="${2:-./result}"
cache='https://pac-nix.cachix.org'

nix eval $1
storepath="$(nix eval $1 --raw)"
echo "storepath=$storepath"
hash="$(nix eval $1 --raw | cut -d/ -f4 | cut -d- -f1)"
echo "hash=$hash"

narinfourl="$cache/$hash.narinfo"
echo "narinfourl=$narinfourl"
narinfo="$(curl $narinfourl --no-progress-meter --fail-with-body)"

compression=$(echo "$narinfo" | grep Compression: | cut -d' ' -f2)
url="$cache"/$(echo "$narinfo" | grep URL: | cut -d' ' -f2)
echo "compression=$compression"
echo "url=$url"

unzip=""
case "$compression" in
  "zstd") unzip=zstdcat ;;
  "xz") unzip=xzcat ;;
  "none") unzip=cat ;;
esac

if [[ -z "$unzip" ]]; then
  echo "$0: error: unsupported compression scheme '$compression'" >&2
  exit 1
fi

curl --no-progress-meter --fail-with-body "$url" | $unzip | nix-store --restore $result

