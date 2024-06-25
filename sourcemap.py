#!/usr/bin/env python3

"""
extracts an inline source map into a separate .map file.

usage: ./sourcemap.py source.js tempout.js source.map

this will write tempout.js and tempout.map.
the embedded 'sourceMappingURL' comment will
point to "source.map".

it is the caller's responsibility to rename tempout.map
and tempout.js to source.map and source.js in order
for the source map's file names to be correct.
"""

import base64
import sys
from pathlib import Path

def main():
  with open(sys.argv[1], 'rb') as f:
    orig = f.read()

  sourcemappingurl = b'\n//# sourceMappingURL='
  marker = sourcemappingurl + b'data:application/json;base64,'
  assert marker in orig
  js, sourcemap = orig.split(marker, 1)

  with open(sys.argv[2], 'wb') as f:
    f.write(js)
    f.write(b'\n' + sourcemappingurl + sys.argv[3].encode('ascii'))

  with open(Path(sys.argv[2]).with_suffix('.map'), 'wb') as f:
    f.write(base64.b64decode(sourcemap))

if __name__ == '__main__':
  main()
