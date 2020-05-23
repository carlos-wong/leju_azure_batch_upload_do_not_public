#!/bin/bash

export CONNECT_STR='DefaultEndpointsProtocol=https;AccountName=tencentcoding;AccountKey=/EucpM54W6E9Gd0psYD/D4flNJxJTtaLkyVWS/PsrKJKqeC2Ww01ZRIfJSIkj/EyLKCN2gZfkoPqiYwtIaHJpQ==;EndpointSuffix=core.chinacloudapi.cn'

#$1 container name  $2 path $3 file regex

node /Users/carlos/Documents/leju/APPS/carlos/azure-blob-batch-upload-tool/index_keep_path.js  $1 $2 $3
