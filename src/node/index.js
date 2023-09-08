import fs from 'fs'

import FileConverter from './fileConverter.js'

async function main(sourceFolder,targetFolder) {

  const fileConverter = new FileConverter()
  const configFile = JSON.parse(fs.readFileSync('config.json'));
  await fileConverter.convertFiles(configFile);
  
}

main().then(() =>  {
  console.log(new Date().toISOString(),'Exit')
}).catch((e) => {
  console.log(new Date().toISOString(),e)
})

