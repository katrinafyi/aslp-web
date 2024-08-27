importScripts('js.bc.js', 'cache.js', 'lib/pako.min.js', 'lib/comlink.js');

const formatOCamlExceptions = f => (...args) => {
  try {
    f(...args);
  } catch (e) {
    if (e instanceof Array) {
      // convert ocaml representation of errors into
      // javascript representation.
      setTimeout(() => { throw e; }, 0);
    } else {
      throw e;
    }
  }
};

// const queue = [];
// let processor = null;
// const queueify = write => {
//
//   const process = async () => {
//     while (queue.length > 0) {
//       const [f, s] = queue.shift();
//       // console.log(s);
//       await f(s);
//     }
//     processor = null;
//   };
//
//   return s => {
//     queue.push([write, s]);
//     if (processor == null) {
//       processor = process();
//     }
//   };
// };

const methods = {
  init: formatOCamlExceptions((writer) => {
    // const outs = queueify(out);
    // const errs = queueify(err);
    // libASL_web.init(outs, errs);

    // XXX: do not eta reduce, functions must return nothing.
    libASL_web.init(
      s => { writer(false, s); },
      s => { writer(true, s); });
  }),

  boop: f => {
    f(100); // testing
  },

  unmarshal: formatOCamlExceptions((arraybuf) => {
    unmarshal(arraybuf);
  }),

  dis: formatOCamlExceptions(({ opcode, debug }) => {
    libASL_web.setDebugLevel(debug);
    libASL_web.dis(opcode);
  }),

};

Comlink.expose(methods);
