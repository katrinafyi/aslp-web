{ lib
, buildDunePackage
, nix-gitignore
, asli
, js_of_ocaml
, js_of_ocaml-ppx
, js_of_ocaml-compiler
, nodejs-slim
}:

buildDunePackage rec {
  pname = "aslp_web";
  version = "unstable-2024-06-25";

  buildInputs = [ asli js_of_ocaml js_of_ocaml-ppx ];
  nativeBuildInputs = [ js_of_ocaml-compiler nodejs-slim ];

  src = nix-gitignore.gitignoreSource [ "*.nix" "flake.nix" ] ./.;

  postPatch = ''
    export aslp=${asli.name}
    export aslp_commit=${asli.src.rev}
    export aslp_web=$name
    export aslp_web_commit=${src.rev or "unknown"}

    substituteAllInPlace web/index.html
  '';

  meta = {
    homepage = "https://github.com/katrinafyi/aslp-web";
    description = "aslp on the web";
    maintainers = with lib.maintainers; [ katrinafyi ];
  };
}
