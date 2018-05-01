#!/bin/bash

base_dir=$(cd $(dirname $0) && pwd)

if [ ! -e ${base_dir}/plantuml.jar ]; then
  curl -L https://sourceforge.net/projects/plantuml/files/plantuml.jar/download > ${base_dir}/plantuml.jar
fi

ls ${base_dir}/txt/*.txt | while read file; do
  java -jar ${base_dir}/plantuml.jar ${file} -charset UTF-8 -o ${base_dir}/png/
done
