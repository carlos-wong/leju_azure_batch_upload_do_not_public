#!/usr/bin/env node
const { promisify } = require('util');
var exec = require('child_process').exec;
const { resolve } = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const _ = require('lodash');
const path = require('path');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// require('dotenv').config()


async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

let [cmd,scirptname,containerName,scan_dir,file_name_regex] = process.argv;

console.log("Dump process argv is:",process.argv);

// console.log("Dump containerName is:",containerName," scan_dir is:",scan_dir," file_name_regex is:",file_name_regex);

async function batch_upload_files(files_list,connect_str,containerName) {
  console.log("Left files to upload is:",files_list.length);
  if (files_list[0]) {
    await upload_file_to_auzre(connect_str,containerName,files_list[0])
    return batch_upload_files(_.slice(files_list,1),connect_str,containerName);
  }
}

const text_html_content_type_list = [".js",".html",".css"];

async function upload_file_to_auzre(connect_str,containerName,dist_file) {
  var upload_file_path = '.'+_.split(dist_file,script_cwd)[1];
  console.log("Uploading file:",upload_file_path," is set to text/html:",_.includes(text_html_content_type_list,path.extname(dist_file)));
  const blobServiceClient = await BlobServiceClient.fromConnectionString(connect_str);
  const containerClient = await blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(upload_file_path);
  if (_.includes(text_html_content_type_list,path.extname(dist_file)) ) {
    return await blockBlobClient.uploadFile(dist_file,{
      blobHTTPHeaders: {
        blobContentType: "text/html"
      }
    });
  }
  else{
    return await blockBlobClient.uploadFile(dist_file);
  }
}

const script_cwd = path.resolve(process.cwd(), '.');

console.log("scan_dir is:",scan_dir);

getFiles(scan_dir)
  .then(files => {
    return _.filter(files,(filename)=>{
      // console.log("Dump filename is:",filename);
      
      return filename.match(file_name_regex)
    });
  })
  .then(valid_files=>{
    var filenames = _.map(valid_files,(value,key)=>{
      // console.log("Dump dist_file to upload is:",value," split cwd path is:",);
      return _.split(value,script_cwd)[1];
    });
    // console.log("Dump filenames is:",filenames);
    batch_upload_files(valid_files,process.env.CONNECT_STR,containerName)
  })
  .catch(e => console.error(e));

