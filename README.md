# ASLp Web

This provides a simple web interface for the ASLp partial evaluator.

<details>
  <summary>Screenshot</summary>

  ![](https://github.com/user-attachments/assets/ac0cecea-90ea-4aab-8bf1-452f35f3b6fb)

</details>

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

Note: Although a package.json is present, NPM is _not_ required (or able) to build this project.
This is used only for the Cypress E2E tests. Efforts are made to avoid NPM as far as possible.

## deploy

The deployment of the live version of the interface is handled by code in the
[`deploy`](https://github.com/katrinafyi/aslp-web/tree/deploy)
branch of this repository.
See the branch README for more details.

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

## testing

Basic end-to-end tests are written using the Cypress framework and
run by GitHub actions on push.

To run these locally, you will need npm.
```bash
npm install
npm run test
```

To open the visual Cypress editor,
```bash
npx cypress open
```


