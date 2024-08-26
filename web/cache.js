
const IS_NODE = typeof self !== 'object';

if (IS_NODE) {
  global.fs = require('fs');
  global.path = require('path');
  // global.libASL_web = require('./js.bc.js').libASL_web;
  global.libASL_builder = require('./builder.bc.js').libASL_builder;
  global.pako = require('./lib/pako.min.js');
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


const unmarshal = async (/* ArrayBuffer */ buf) => {
  try {
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
