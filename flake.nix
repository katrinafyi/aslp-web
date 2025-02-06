{
  inputs.pac-nix.url = "github:katrinafyi/pac-nix/nixpkgs-update-for-dune-3-17";

  nixConfig.extra-substituters = [ "https://pac-nix.cachix.org/" ];
  nixConfig.extra-trusted-public-keys = [ "pac-nix.cachix.org-1:l29Pc2zYR5yZyfSzk1v17uEZkhEw0gI4cXuOIsxIGpc=" ];

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
