{
  description = "LandsOfHope.Data";

  inputs = {
    nixpkgs.url = "github:etinquis/nixpkgs/nixos-26.05";

    bun2nix = {
      url = "github:nix-community/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      bun2nix,
    }:
    let
      inherit (nixpkgs) lib;
      forSystems = lib.genAttrs lib.systems.flakeExposed;
    in
    {

      packages = forSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
            overlays = [
              bun2nix.overlays.default
            ];
          };
        in
        rec {
          default = landsofhope-cdn-data;

          landsofhope-cdn-data = pkgs.stdenv.mkDerivation rec {
            pname = "landsofhope-cdn-data";
            version = (builtins.fromJSON (builtins.readFile ./package.json)).version;
            src = ./.;
            strictDeps = true;
            nativeBuildInputs = [
              pkgs.bun2nix.hook
              pkgs.bun
              pkgs.biome
              pkgs.rsync
            ];
            bunRoot = ".scripts";
            bunDeps = pkgs.bun2nix.fetchBunDeps {
              bunNix = (
                pkgs.runCommand "generate-bun-nix" { } ''
                  ${pkgs.bun2nix}/bin/bun2nix -l ${src}/.scripts/bun.lock -o $out
                ''
              );
            };
            buildPhase = ''
              runHook preBuild
              set -euxo pipefail

              bun .scripts/generate_all_json
              bun .scripts/generate_id_schemas
              bun .scripts/generate_other_schemas
              bun .scripts/validate
              bun .scripts/compile_schemas
              (find schemas -name '*.json' | xargs -n1 -P0 bun .scripts/generate_api_ts.ts)
              bun .scripts/generate_search_indexes
              biome check api/ --write || true

              runHook postBuild
            '';
            installPhase = ''
              runHook preInstall
              mkdir -p $out
              rsync --archive --whole-file --one-file-system --safe-links --prune-empty-dirs --exclude-from='.scripts/dist-exclude.txt' ./ $out/
              runHook postInstall
            '';
            dontFixup = true;
          };

          publish = pkgs.writeShellApplication {
            name = "publish-landsofhope-cdn-data";
            runtimeInputs = [
              pkgs.awscli
            ];
            text = ''
              #!/usr/bin/env bash
              set -euo pipefail

              AWS_ACCESS_KEY_ID=$1
              shift
              AWS_SECRET_ACCESS_KEY=$1
              shift
              AWS_ENDPOINT_URL=$1
              shift
              BUCKET_NAME=$1
              shift

              cd ${landsofhope-cdn-data}
              AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
              AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
              AWS_ENDPOINT_URL="$AWS_ENDPOINT_URL" \
                aws s3 sync . "s3://$BUCKET_NAME" \
                  --exact-timestamps --delete \
                  --region=auto
            '';
          };

        }
      );

      overlays = {
        landsofhope-cdn-data = final: prev: {
          landsofhope-cdn-data = final.packages.${final.system}.landsofhope-cdn-data;
        };
      };

      devShells = forSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };
        in
        rec {
          default = devShell;

          devShell = pkgs.mkShellNoCC {
            buildInputs = with pkgs; [
              bun
              biome
              jq
              nixfmt
            ];
          };
        }
      );

    };

}
