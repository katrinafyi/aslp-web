{
  inputs.pac-nix.url = "github:katrinafyi/pac-nix";

  outputs = {self, pac-nix}:
    let
      nixpkgs = pac-nix.inputs.nixpkgs;

      forAllSystems = f:
        nixpkgs.lib.genAttrs [
          "x86_64-linux"
          "aarch64-linux"
          "x86_64-darwin"
          "aarch64-darwin"
        ] (system: f system pac-nix.legacyPackages.${system});

    in {
      packages = forAllSystems (sys: pac-nix: {
        default =
          pac-nix.aslp_web.overrideAttrs {
            name = "aslp-web-local-build";
            src = nixpkgs.lib.cleanSource ./.;
          };
      });
    };
}
