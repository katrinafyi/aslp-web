#!/usr/bin/env python3

# vim: ts=2 sts=2 et sw=2

import os
import sys
import html
import shutil
import subprocess

VERSION_CSV = 'versions.csv'
OUT_PATH = './out'

q = html.escape

# date +"%Y-%m-%d %H:%M:%S%z"

def main():
  os.makedirs(OUT_PATH)

  versions = []
  with open(VERSION_CSV) as f:
    for l in f:
      if not l.strip(): continue
      versions.append([x.strip() for x in l.strip().split(',')])

  print(*versions, sep='\n')
  for v,flake,path,time in versions:
    print('building', v, flake)
    result = 'result_' + v

    subprocess.check_call(['nix', 'build', '-L', '--out-link', result, flake])

    shutil.copytree(result + '/' + path + '/.', OUT_PATH + '/' + v, copy_function=shutil.copy)

  shutil.copy('./index.html', OUT_PATH)
  shutil.copy('./reset.css', OUT_PATH)

  listing = [f'<a href="{q(v)}/">build {q(v)}</a> (<code>{q(t)}</code>)<!-- {q(flake)} {q(path)} -->'.encode('ascii') for v,flake,path,t in versions]
  
  latest = listing[-1]
  other = b'\n'.join(b'<li>'+x+b'</li>' for x in reversed(listing))

  with open(OUT_PATH + '/index.html', 'rb') as f:
    html = f.read()
  with open(OUT_PATH + '/index.html', 'wb') as f:
    f.write(html
      .replace(b'<!--VERSIONS-->', other)
      .replace(b'<!--LATEST-->', latest))


if __name__ == '__main__':
  main()
