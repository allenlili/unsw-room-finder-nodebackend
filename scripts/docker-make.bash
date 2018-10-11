#!/usr/bin/env bash

# runs a command with make a new container using the latest
# image, if said image doesn't exist it'll fail
main() {
  local package_version=`cat package.json | jq .version -r`
  local name=comp9323_make
  local port=8080
  local cmd=run

  if [ "$1" != "" ]; then
    name="comp9323_make__$1"
  fi

  if [ "$2" != "" ]; then
    port=$2
  fi

  if [ "$3" != "" ]; then
    cmd=$3
  fi

  docker run -it --rm --name $name \
		-p $port:8080 \
    -v "$(pwd)/dist:/application/dist" \
    -v "$(pwd)/src:/application/src" \
    -v "$(pwd)/test:/application/test" \
    -v "$(pwd)/Makefile:/application/Makefile" \
    -v "$(pwd)/.eslintrc.json:/application/.eslintrc.json" \
    -v "$(pwd)/.babelrc:/application/.babelrc" \
    -v "$(pwd)/.flowconfig:/application/.flowconfig" \
    -v "$(pwd)/config:/application/config" \
    comp9323:$package_version make $cmd
}

main $@
