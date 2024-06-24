{
  description = "A very basic flake";

  inputs.pac-nix.url = "github:katrinafyi/pac-nix";

  outputs = { self, pac-nix }: 
    let
      pkgs = pac-nix.lib.nixpkgs;
      ocamlPackages = pkgs.ocamlPackages_pac;

      asli = pkgs.asli.overrideAttrs (p: {
        propagatedBuildInputs = p.propagatedBuildInputs ++ [ ocamlPackages.zarith_stubs_js ];
        src = pkgs.fetchFromGitHub {
          owner = "UQ-PAC";
          repo = "aslp";
          rev = "ca9100dcf2ad79440debd0b986090414e3412206";
          hash = "sha256-RbD/wfP1WlzI3otgepV+V4ttvNP1xGpGond9teZd/6o=";
        };
      });
    in
    assert (builtins.currentSystem == "x86_64-linux");
    {
      packages.x86_64-linux.aslp_web = ocamlPackages.callPackage ./aslp_web.nix { inherit asli; };
    };
}
