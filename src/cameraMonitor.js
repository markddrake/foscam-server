"use strict"

const fs = require("fs")
const fsp = require("fs").promises
const {watch}  = require("fs/promises")
const path = require("path")
const {spawn} = require('child_process')

class CameraMointor {
	
  constructor() {
	 	 
  }
  
  async listFolder(folderPath) {
    const directoryList = await fsp.readdir(folderPath,{ withFileTypes: true})
    const fileList = await Promise.all(directoryList.map((dirEntry) => {
      const dirEntryPath = path.join(folderPath,dirEntry.name)
      return dirEntry.isFile() ? dirEntryPath : this.listFolder(dirEntryPath)
    }))
	return fileList.flat(10)
  }
  
  async buildFileList(baseFolder) {
     
	 return await this.listFolder(baseFolder)
	 
  }
  
  async monitorCameras(sourceFolder,outputFolder) {
	
    const fileList = await this.buildFileList(path.resolve(sourceFolder))
	console.log(fileList)
	let currentFolder = undefined
	const transforms = await Promise.all(fileList.map((file) => {
	  const extension = path.extname(file)
	  const filename = path.basename(file,extension)
	  const record = path.dirname(file)
	  const cameraIdPath = path.dirname(record)
	  const cameraId = path.basename(cameraIdPath)
	  const cameraLocationPath = path.dirname(cameraIdPath)
	  const cameraLocation = path.basename(cameraLocationPath)
	  const filenameComponents = filename.split('_');
	  const recordingDate = filenameComponents[1]
	  const recordingTime = filenameComponents[2]
	  const targetFolder =  path.join(outputFolder,cameraLocation,`${recordingDate.substring(0,4)}-${recordingDate.substring(4,6)}-${recordingDate.substring(6)}`)
	  const target = path.join(targetFolder,`${recordingTime}.mp4`)
	  if (targetFolder !== currentFolder) {
		let currentFolder = targetFolder
	    fsp.mkdir(targetFolder,{recursive:true});
	  }
	  return new Promise((resolve,reject) => {
		console.log(file,'==>',target)
		const ffmpeg = spawn('ffmpeg',[` -i ${file}`,'-codec copy','-y',target],{shell:true})
	    ffmpeg.on('exit',(code) => {
		  resolve(code)
   	    })
	    ffmpeg.stderr.on('data', (data) => {
          // console.error(data.toString());
        });
	    ffmpeg.stdout.on('data', (data) => {
          // ffmpeg -console.log(data.toString());
        });
	  })
	}))
  }
       
}

module.exports = CameraMointor