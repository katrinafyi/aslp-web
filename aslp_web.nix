{ lib
, buildDunePackage
, nix-gitignore
, asli
, js_of_ocaml
, js_of_ocaml-ppx
, js_of_ocaml-compiler
, nodejs-slim
}:

buildDunePackage {
  pname = "aslp_web";
  version = "unstable";

  buildInputs = [ asli js_of_ocaml js_of_ocaml-ppx ];
  nativeBuildInputs = [ js_of_ocaml-compiler nodejs-slim ];

  src = nix-gitignore.gitignoreSource [ "*.nix" "flake.nix" ] ./.;

  meta = {
    homepage = "https://github.com/katrinafyi/aslp-web";
    description = "aslp on the web";
    maintainers = with lib.maintainers; [ katrinafyi ];
  };
}
