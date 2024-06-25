
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

if (IS_NODE) {
  marshal();
}
