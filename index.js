#!/usr/bin/env node
const { promisify } = require('util');
const { resolve } = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const _ = require('lodash');
const path = require('path');
const uuidv1 = require('uuid/v1');
const fs = require('fs');
// const readdir = promisify(fs.readdir);
// const stat = promisify(fs.stat);

// require('dotenv').config()

const { readdir } = require('fs').promises;

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}



// async function getFiles(dir) {
//   const subdirs = await readdir(dir);
//   const files = await Promise.all(subdirs.map(async (subdir) => {
//     const res = resolve(dir, subdir);
//     return (await stat(res)).isDirectory() ? getFiles(res) : res;
//   }));
//   return files.reduce((a, f) => a.concat(f), []);
// }

let [cmd,scirptname,containerName,scan_dir,file_name_regex] = process.argv;

console.log("Dump containerName is:",containerName," scan_dir is:",scan_dir," file_name_regex is:",file_name_regex);

async function batch_upload_files(files_list,connect_str,containerName) {
  console.log("Left files to upload is:",files_list.length);
  if (files_list[0]) {
    console.log("Uploading:",files_list[0]);
    await upload_file_to_auzre(connect_str,containerName,files_list[0])
    return batch_upload_files(_.slice(files_list,1),connect_str,containerName);
  }
}


async function upload_file_to_auzre(connect_str,containerName,dist_file) {
  const blobServiceClient = await BlobServiceClient.fromConnectionString(connect_str);
  const containerClient = await blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(path.basename(dist_file));
  return await blockBlobClient.uploadStream(fs.createReadStream(dist_file));
}

getFiles(scan_dir)
  .then(files => {
    return _.filter(files,(filename)=>{
      return filename.match(file_name_regex)
    });
  })
  .then(valid_files=>{
    batch_upload_files(valid_files,process.env.CONNECT_STR,containerName)
  })
  .catch(e =>{
      console.error(e)
      return process.exit(1);

    });

