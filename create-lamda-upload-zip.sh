#!/bin/bash

script_dir=$(cd $(dirname $0) && pwd)
zip_file=${script_dir}/upload.zip
cd $script_dir/amazon-lambda

npm install
if [ -e ${zip_file} ]; then
  rm -fv ${zip_file}
fi
zip -r ${zip_file} *

