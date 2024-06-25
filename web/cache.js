
const IS_NODE = typeof window === 'undefined';

if (IS_NODE) {
  global.fs = require('fs');
  global.path = require('path');
  // global.libASL_web = require('./js.bc.js').libASL_web;
  global.libASL_builder = require('./builder.bc.js').libASL_builder;
  global.pako = require('./pako.min.js');
}

const marshal = () => {
  if (!IS_NODE) throw Error("marshalling only supported on node");

  console.log('marshalling aslp environment...');
  const arr = pako.gzip(libASL_builder.marshal(libASL_builder.force()));

  let marshalUrl;
  if (IS_NODE) {
    fs.writeFileSync('aslp.heap', Buffer.from(arr));
    marshalUrl = path.resolve('.', 'aslp.heap');

  } else {
    marshalUrl = URL.createObjectURL(
      new File(
        [arr],
        'aslp.heap',
        { lastModified: Date.now(), type: 'application/octet-stream' }));

  }
  console.log(marshalUrl);
};

const HEAP = 'aslp.heap';

const fetchHeap = async () => {
  if (!window.caches) {
    console.warn('fallback to non-cached fetch');
    return fetch(HEAP);
  }

  const cache = await caches.open('aslp-web-' + window.location.pathname);

  if (await cache.match(HEAP) == null) {
    console.log('not cached');
    await cache.add(HEAP);
  } else {
    console.log('cached');
  }

  return cache.match(HEAP);
}

const unmarshal = async () => {
  try {
    const resp = await fetchHeap();

    if (!resp.ok) throw new Error('fetch failure');
    const buf = await resp.arrayBuffer();
    const arr = pako.ungzip(new Uint8Array(buf));

    libASL_web.unmarshal(arr);
    console.log(`heap loaded: ${arr.length} bytes, ${buf.byteLength} compressed`);

  } catch (e) {
    console.warn('failed to fetch heap');
    console.warn(e);
  }
};

if (IS_NODE) {
  marshal();
}
