#!/bin/bash

declare YES

while getopts ":y:" opt; do
  case $opt in
    :)
      YES=true
      ;;
  esac
done

if [[ ! $YES ]]; then
  read -p "Clean test script will destroy and recreate the local environment. Existing blockchain data will be lost and the RPC URL will change! Is that ok? [Y/n]" -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    YES=true;
  fi
fi

if [[ $YES ]]; then
  avalanche network clean
  avalanche subnet deploy --local test
  export LOCAL_RPC_URL=$(avalanche network status | grep 'Endpoint at node2' | awk '{print $NF}')
  sleep 60 # Wait so network can get ready
  TS_NODE_TRANSPILE_ONLY=1 hardhat test --network 'local'
fi
