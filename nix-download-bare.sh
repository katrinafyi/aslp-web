#!/bin/bash -eu

set -o pipefail

printf '%q ' "$0:" "$@"
echo

flake_ref="$1"
result="${2:-./result}"
cache='https://pac-nix.cachix.org'

nix eval $1
storepath="$(nix eval $1 --raw)"
echo "storepath=$storepath"
hash="$(nix eval $1.outPath --raw | cut -d/ -f4 | cut -d- -f1)"
echo "hash=$hash"

narinfourl="$cache/$hash.narinfo"
echo "narinfourl=$narinfourl"
narinfo="$(curl $narinfourl --no-progress-meter --fail-with-body)"

compression=$(echo "$narinfo" | grep Compression: | cut -d' ' -f2)
narhash=$(echo "$narinfo" | grep NarHash: | cut -d':' -f3)
narhashalgo=$(echo "$narinfo" | grep NarHash: | cut -d':' -f2 | tr -d ' ')
url="$cache"/$(echo "$narinfo" | grep URL: | cut -d' ' -f2)
echo "compression=$compression"
echo "url=$url"
echo "narhash=$narhash, narhashalgo=$narhashalgo"

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

if [[ -e "$result" ]]; then
  if [[ -n "$narhash" ]] && [[ "$(nix-hash --base32 $result --type $narhashalgo)" == "$narhash" ]]; then
    echo "... existing result has correct hash: $narhash"
    exit 0
  else
    echo "... removing existing result output"
    rm -rf "$result"
  fi
fi

curl --no-progress-meter --fail-with-body "$url" | $unzip | nix-store --restore $result

