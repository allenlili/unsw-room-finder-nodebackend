#!/usr/bin/env bash
main() {
  local package_version=`cat package.json | jq .version -r`
  docker build -f ./Dockerfile --tag comp9323:$package_version --rm .
}

main $@
