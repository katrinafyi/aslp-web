
const IS_NODE = typeof window === 'undefined';

if (IS_NODE) {
  global.fs = require('fs');
  global.path = require('path');
  global.libASL_web = require('./js.bc.js').libASL_web;
}

const marshal = () => {
  const arr = libASL_web.marshal();
  console.log('marshalling aslp environment...');

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

const unmarshal = async () => {
  try {
    const HEAP = 'aslp.heap';
    const cache = await caches.open('aslp-web-' + window.location.pathname);

    if (await cache.match(HEAP) == null) {
      console.log('not cached');
      await cache.add(HEAP);
    } else {
      console.log('cached');
    }

    const resp = await cache.match(HEAP);
    if (!resp.ok) throw new Error('fetch failure');

    const buf = await resp.arrayBuffer();
    const arr = new Uint8Array(buf);

    libASL_web.unmarshal(arr);
    console.log(`heap loaded: ${arr.length} bytes`);

  } catch (e) {
    console.warn('failed to fetch heap');
    console.warn(e);
  }
};

if (IS_NODE) {
  marshal();
}
