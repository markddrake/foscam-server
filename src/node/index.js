import fs from 'fs'

import FileConverter from './fileConverter.js'
import RetentionManager from './retentionManager.js'

async function main(sourceFolder,targetFolder) {

  const configFile = JSON.parse(fs.readFileSync('config.json'));

  const fileConverter = new FileConverter()
  fileConverter.initialize(configFile).then(() => {console.log(new Date().toISOString(),'[FILE CONVERTER]','Exit')}).catch((e) => {console.log(new Date().toISOString(),'[FILE CONVERTER]','Error',e)})
  
  const retentionManager = new RetentionManager()
  retentionManager.initialize(configFile).then(() => {console.log(new Date().toISOString(),'[RETENTION MANAGER]','Exit')}).catch((e) => {console.log(new Date().toISOString(),'[RETENTION MANAGER]','Error',e)})

}

main().then(() =>  {
  console.log(new Date().toISOString(),'Exit')
}).catch((e) => {
  console.log(new Date().toISOString(),e)
})

