# ASLp Web

This provides a simple web interface for the ASLp partial evaluator.

Screenshot:

![image](https://github.com/katrinafyi/aslp-web/assets/39479354/32f352bb-e178-4321-832b-29717f28c10e)

## build

To build the interface, you will need: the Dune build system, the ASLp OCaml package, and NodeJS. 
```
opam install --deps-only ./*.opam
```
Be careful to avoid installing the `asli` package from the opam repositories.
This is the original ASLi interpreter, not ASLp, so it will not be compatible.

Then, you can build the website with:
```
dune build @install
```
This builds the website to `_build/install/default/lib/aslp_web`.
This directory can be uploaded to a static website hosting service.

Note: Although a package.json is present, NPM is _not_ required (or able) to build this project. This is used only for the Cypress E2E tests. It is a design goal to avoid NPM as far as possible.

## deploy

The deployment of the live version of the interface is handled by code in the
[`deploy`](https://github.com/katrinafyi/aslp-web/tree/deploy)
branch of this repository.

This contains scripts to reproducibly build multiple versions of the aslp-web interface
(so links to aslp-web output are reproducible and permanent).
This is done by building pinned versions of aslp-web and aslp from the [pac-nix](https://github.com/katrinafyi/pac-nix)
repository.

The build can be run using `./build.py`.
Deployment is done by GitHub actions using this same script.

## implementation

All of this website's functionality is implemented within the browser.
The primary ASLp features are via js\_of\_ocaml, with the build
configured by the dune files in this repository.
For the input boxes, the disassembly/assembly is provided by
[capstone.js](https://github.com/rina-forks/capstone.js) /
[keystone.js](https://github.com/ailrst/keystone.js).
These are forks of the AlexAltea repositories, updated
with more recent Emscripten and capstone/keystone.
These, along with a number of pure Javascript libaries,
are vendored within the web/lib directory.
See the respective files for their licence information.

The code is split across the main Javascript file and web workers.
Web workers are used to isolate the computationally-heavy tasks
without blocking the main UI thread.
Currently, there are web workers for the ASLp functionality and the
Capstone/Keystone functionality.


