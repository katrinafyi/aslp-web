# ASLp Web Deployment

This branch controls the deployment of the aslp-web site to GitHub pages, with
scripts to reproducibly build multiple versions of the aslp-web interface
(so links to aslp-web output are reproducible and permanent).
This is done by building pinned versions of aslp-web and aslp
from the [pac-nix](https://github.com/katrinafyi/pac-nix) repository.


## building

The build dependencies are only Python 3.11+ and Nix.

The site can be built with:
```bash
./build.py
```
This will checkout and build all registered versions of the aslp-web interface.
The site will be generated in ./out.
Deployment is done by GitHub actions using this same script.

Be aware that this will require some gigabytes of disk space as multiple
versions of Nix's OCaml toolchain will be downloaded. 

## adding a normal build

Adding a build is a manual process and should not be done too often.
Each build increases the total deployment size and
build time.
Once added, builds should not be removed to ensure links are preserved.

1. As a prerequisite, the desired version of aslp-web should be available
   in [pac-nix](https://github.com/katrinafyi/pac-nix).
   This is updated nightly from aslp-web's main branch.
   A pac-nix update can also be triggered manually.

2. Attempt a Nix build of the new version in isolation with
   ```bash
   nix build -L github:katrinafyi/pac-nix/COMMIT#aslp_web
   ```
   where COMMIT is the pac-nix repository commit which contains
   the updated aslp-web version.

   Check that the files generated in ./result are as you expect.

   Take note of the directory within ./result which contains the site files:
   ```bash
   dirname $(cd result && find . -name index.html)
   ```

4. Add a new comma-separated line to the bottom of the versions.csv file. This has columns:
   - build number: increment this by one.
   - Nix flake reference: the argument to `nix build` above.
   - site directory: path to site files within the Nix derivation, as above.
   - date: your computer's local date and time, via `date +"%Y-%m-%d %H:%M:%S%z"`.
   - change note: a very brief comment on the notable change of this build.

   See [the live site](https://katrinafyi.github.io/aslp-web/) to get an
   idea of how these fields are displayed.

5. Test building with
   ```bash
   ./build.py
   ```
6. Check the generated site and make sure everything looks good.
   ```bash
   python3 -m http.server -d out
   ```
7. Commit and open a pull request to the `deploy` branch.
