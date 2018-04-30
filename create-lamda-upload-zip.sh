/bin/bash

script_dir=$(cd $(dirname $0) && pwd)
cd $script_dir/amazon-lambda

zip -r ../upload.zip *

