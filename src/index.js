"use static"

const CameraMonitor = require('./cameraMonitor.js')

async function main(sourceFolder,targetFolder) {

  cameraMonitor = new CameraMonitor()
  await cameraMonitor.monitorCameras(sourceFolder,targetFolder);
  
}

main('/mount/camera-upload/foscam','/mount/smb').then(() => {console.log(new Date().toISOString(),'Exit')}).catch((e) => {console.log(new Date().toISOString(),e)})


