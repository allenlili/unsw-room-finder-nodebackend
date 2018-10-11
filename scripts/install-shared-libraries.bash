#!/usr/bin/env bash

install_for_osx() {
  if ! which jq; then
    brew install jq
  fi
  if ! which watchman; then
    brew install watchman
  fi
}

install_for_linux() {
  if ! dpkg -s jq; then
    apt-get update
    apt-get install jq
  fi
}

install_for_windows() {
  if ! which jq; then
    # i don't even know how you handle this on windows
    open https://stedolan.github.io/jq/download/
  fi
}

main() {
  local ostype=`uname`;
  [ "$ostype" == "Darwin" ] && install_for_osx
  [ "$ostype" == "Linux" ] && install_for_linux
  [ "$ostype" == "Cygwin" ] && install_for_windows
}

main $@
