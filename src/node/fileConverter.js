 import fs           from "fs"
import fsp          from "fs/promises"
import path         from "path"
import {spawn}      from 'child_process'
import {setTimeout} from "timers/promises"


class FileConverter {
	
  constructor() {	 	 
  }
  
  async listFolder(folderPath) {
    const directoryListing = await fsp.readdir(folderPath,{ withFileTypes: true})
	const fileList = await Promise.all(directoryListing.map((dirEntry) => {
      const dirEntryPath = path.join(folderPath,dirEntry.name)
      return dirEntry.isFile() ? dirEntryPath : this.listFolder(dirEntryPath)
    }))
	return fileList.flat(10)
  }
  
  async buildFileList(folderPath) {
     
	 return await this.listFolder(folderPath)
	 
  }
  
  parseFoscamPath(file) {
	  
	const extension = path.extname(file)
	const filename = path.basename(file,extension).replace('-','_')
	const record = path.dirname(file)
	const cameraIdPath = path.dirname(record)
	const cameraId = path.basename(cameraIdPath)
	const cameraFolderPath = path.dirname(cameraIdPath)
	  
	const cameraFolder = path.basename(cameraFolderPath)
	const filenameComponents = filename.split('_');
	const recordingDate = filenameComponents[1]
	const recordingTime = filenameComponents[2]
	
	return {
      sourceFile     : file
	, extension      : extension
	, recordingDate  : recordingDate
	, recordingTime  : recordingTime
	, cameraFolder   : cameraFolder
	, id             : cameraId
	}
  }	
  
  generatePaths(targetFolder,file) {
  
    const pathInfo = this.parseFoscamPath(file)
	pathInfo.targetFolder = path.join(targetFolder,pathInfo.cameraFolder,`${pathInfo.recordingDate.substring(0,4)}-${pathInfo.recordingDate.substring(4,6)}-${pathInfo.recordingDate.substring(6)}`)
	return pathInfo
 
  }
  
  async moveImage(sourceFile,targetFile) {
	
	try {
      await fsp.copyFile(sourceFile,targetFile)
	  await fsp.chmod(targetFile,0o744)
	  await fsp.rm(sourceFile)      	
	} catch (e) {
	  console.log(e)
	}
	
  }
  
  async repackVideo(sourceFile,targetFile) {

    /*
    **
	** Handle Foscam Scheduled Recordings
	** In Schedule Recording mode files are streamed to.
	** THe file is switched approx every 10 minutes
    ** Do not process the current file until it is complete
	** The file can be considered complete when the next file exists.
	** The next file may be the next day
	**
	*/			
       
	const mtime = await fsp.stat(sourceFile).mtime   
	   
	return new Promise((resolve,reject) => { 
	  const ffmpeg = spawn('ffmpeg',[` -i ${sourceFile}`,'-codec copy','-y',targetFile],{shell:true})
	  ffmpeg.on('exit',async (code) => {
		const mtime1 =  await fsp.stat(sourceFile).mtime   
		if (mtime === mtime1) {
		  await fsp.rm(sourceFile)
		}
		resolve(code || 0)
   	  })
	
      /*
	  **
	  ffmpeg.stderr.on('data', (data) => {
        reject(data.toString());
      });
	  **
	  */
			
	  /*
	  **
	  ffmpeg.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      **
	  */
			
	})
  }
  
  
  
  async convertFile(i,targetFolder,file) {

	 try {
	   const pathInfo = this.generatePaths(targetFolder,file) 
	   
       await fsp.mkdir(pathInfo.targetFolder,{recursive:true})
     	 
       let targetFile
	   switch (pathInfo.extension) {
		  case '.mkv':
            targetFile = path.join(pathInfo.targetFolder,`${pathInfo.recordingTime}.mp4`)
		    console.log(new Date().toISOString(),`[VIDEO][${i}]`,pathInfo.sourceFile,' ==> ',targetFile)
		    return this.repackVideo(pathInfo.sourceFile,targetFile)
		    break;
	      case '.jpg':
	        targetFile = path.join(pathInfo.targetFolder,`${pathInfo.recordingTime}${pathInfo.extension}`)
		    console.log(new Date().toISOString(),`[IMAGE][${i}]`,pathInfo.sourceFile,' ==> ',targetFile)
		    return this.moveImage(pathInfo.sourceFile,targetFile)
		    break;
         default:
	       console.log(new Date().toISOString(),'[FILE]',pathInfo.sourceFile)   
		   // awaitfsp.rm(pathInfo.sourceFile)
       }
	 } catch (e) {
		 console.log(e)
	 }
   }	 
	
  
  async convertFiles(config) {
	  
	while (true) {
      console.log(new Date().toISOString(),`Moving files from "${config.sourceFolder}" to "${config.targetFolder}"`)
	  const fileList = await this.buildFileList(path.resolve(config.sourceFolder))
	  const taskList = fileList.entries()
	 
	  const result = []
      const workers = Array(config.parallelLimit).fill(taskList).map(async (taskList,i) => {
	    for (let [tidx, task] of taskList) {
		  result.push(await this.convertFile(tidx,config.targetFolder,task))
	    }
	  })

      await Promise.allSettled(workers)

      console.log(new Date().toISOString(),`[SLEEP] Processed ${result.length} Files.`)	
	  await setTimeout(config.delay * 60 * 1000)
	}
  }
  
}

export { FileConverter as default }