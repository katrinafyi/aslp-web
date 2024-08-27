importScripts('js.bc.js', 'cache.js', 'lib/pako.min.js', 'lib/comlink.js');

const formatOCamlExceptions = f => (...args) => {
  try {
    return f(...args);
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

const methods = {
  init: formatOCamlExceptions((out, err) => {
    // XXX: do not eta reduce, functions must return nothing.
    libASL_web.init(
      s => { out(s); },
      s => { err(s); });
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
