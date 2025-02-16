#!/usr/bin/env python3

# vim: ts=2 sts=2 et sw=2

import os
import sys
import html
import shutil
import functools
import subprocess
import dataclasses

VERSION_CSV = 'versions.csv'
OUT_PATH = './out'

q = html.escape

# date +"%Y-%m-%d %H:%M:%S%z"

@dataclasses.dataclass(frozen=True)
class Row:
  id: str
  flake: str
  path: str
  date: str
  desc: str

diff_url = 'https://github.com/katrinafyi/aslp-web/compare/{0}...{1}'
pacnix_diff_url = 'https://github.com/katrinafyi/pac-nix/compare/{0}...{1}'

def commit(v: Row) -> str | None:
  front, back = 'github:katrinafyi/pac-nix/', '#aslp_web'
  if v.flake.startswith(front) and v.flake.endswith(back):
    return v.flake.replace(front, '', 1).replace(back, '', 1)
  return None

@functools.cache
def src_rev(v: Row) -> str | None:
  try:
    return subprocess.check_output(['nix', 'eval', '--raw', v.flake + '.src.rev'], encoding='utf-8')
  except Exception:
    return None

def rows(versions: list[Row]):
  for i, ver in enumerate(versions):
    (v,flake,path,t,desc) = ver.id, ver.flake, ver.path, ver.date, ver.desc

    i -= 1
    diff = url = ''
    c = p = None
    prev = ver # XXX: for typing only

    # find previous pac-nix commit
    while (c := src_rev(ver)) and i >= 0:
      prev = versions[i]
      if p := src_rev(prev):
        url = diff_url.format(p, c)
        diff = f'<small>(<a href="{q(url)}/" target="_blank" rel="noopener noreferrer">diff from {q(prev.id)}</a>)</small>'
        break
      i -= 1

    yield f'''
<!--
  {q(flake)}
  {q(path)}
  {q(url) if diff else '(no aslp-web diff)'}
  {q(pacnix_diff_url.format(commit(prev), commit(ver))) if diff else '(no pac-nix diff)'}
-->
<a href="{q(v)}/">build {q(v)}</a>
({q(desc)})
{diff}
<small><code>{q(t)}</code></small>
'''.strip().encode('ascii')


def main():
  os.makedirs(OUT_PATH)

  data = []
  with open(VERSION_CSV) as f:
    for l in f:
      if not l.strip(): continue
      data.append([x.strip() for x in l.strip().split(',')])

  versions = [Row(v,flake,path,t,desc) for v,flake,path,t,desc in data]

  print(*versions, sep='\n')
  for v in versions:
    print()
    print('building', v)
    result = 'result_' + v.id

    if 0 != subprocess.call(['./nix-download-bare.sh', v.flake, result]):
      subprocess.check_call(['nix', 'build', '-L', '--out-link', result, v.flake])

    shutil.copytree(result + '/' + v.path + '/.', OUT_PATH + '/' + v.id, copy_function=shutil.copy)

    if os.path.exists(result + '/404.html'):
      shutil.copy(result + '/404.html', OUT_PATH)

  shutil.copy('./index.html', OUT_PATH)
  shutil.copy('./reset.css', OUT_PATH)

  listing = list(rows(versions))

  latest = listing[-1]
  other = b'\n\n'.join(b'<li>\n'+x+b'\n</li>' for x in reversed(listing))

  with open(OUT_PATH + '/index.html', 'rb') as f:
    html = f.read()
  with open(OUT_PATH + '/index.html', 'wb') as f:
    f.write(html
      .replace(b'<!--VERSIONS-->', other)
      .replace(b'<!--LATEST-->', latest))


if __name__ == '__main__':
  main()
