importScripts('offline_js.bc.js', 'lib/comlink.js');

const formatOCamlExceptions = f => (...args) => {
  try {
    f(...args);
  } catch (e) {
    if (e instanceof Array) {
      // convert ocaml representation of errors into
      // javascript representation.
      // XXX: deferring via setTimeout avoids returning this to the caller.
      // this allows the ocaml exception to be processed by our global
      // exception handler, from ocaml.
      setTimeout(() => { throw e; }, 0);

      // XXX: pull out the jsoo-specific exception and print it after
      // the ocaml exception. this is a normal js exception.
      if (e.js_error) {
        console.error(e.js_error);
        throw e.js_error;
      }
    } else {
      throw e;
    }
  }
};

let w;
const methods = {
  init: formatOCamlExceptions((writer) => {
    console.log('offline worker init');
    // XXX: do not eta reduce, functions must return nothing.
    w = writer;
    aslp_offline.init(
      s => { writer(false, s); },
      s => { writer(true, s); });
  }),

  dis: formatOCamlExceptions((args) => {
    const { opcode, debug, flags } = args;
    console.log('offline worker dis:', args);
    aslp_offline.dis(opcode);
  }),
};

Comlink.expose(methods);
