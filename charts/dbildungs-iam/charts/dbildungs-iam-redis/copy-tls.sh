#!/bin/bash
STAGING_DIR="/staging"
MOUNTED_FILES_DIR="/tls"
CONFIG_DIR=/data/tls

pushd .

mkdir -p $STAGING_DIR
cp -v $MOUNTED_FILES_DIR/gencert.sh /staging
cd $STAGING_DIR

chmod ugo+x gencert.sh
./gencert.sh
mkdir -p $CONFIG_DIR
cp -v tls/redis.crt tls/redis.key tls/ca.crt $CONFIG_DIR
cp -v $MOUNTED_FILES_DIR/redis.conf $CONFIG_DIR
popd
rm -rf $STAGING_DIR