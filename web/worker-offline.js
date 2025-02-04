importScripts('offline.bc.js', 'lib/comlink.js');

const formatOCamlExceptions = f => (...args) => {
  try {
    f(...args);
  } catch (e) {
    if (e instanceof Array) {
      // convert ocaml representation of errors into
      // javascript representation.
      // XXX: deferring via setTimeout avoids returning this to the caller.
      setTimeout(() => { throw e; }, 0);
    } else {
      throw e;
    }
  }
};

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

  dis: formatOCamlExceptions((args) => {
    const { opcode, debug, flags } = args;
    console.log('offline worker dis:', args);
    aslp_offline.dis(opcode);
  }),
};

Comlink.expose(methods);
