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
