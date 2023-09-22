import fs           from "fs"
import fsp          from "fs/promises"
import path         from "path"
import {
  setInterval
, setTimeout
}                   from "timers/promises"

class RetentionManager {
	
  isValidDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (dateString.match(regEx)) {
      const time = new Date(dateString).getTime()
      return !isNaN(time)
	}
    return false
  }
  
  async processFolder(entry,retentionDate) {
	// console.log(`ProcessingFolder(${path.join(entry.path,entry.name)})`)
	try {
	const subFolderList = (await fsp.readdir(path.join(entry.path,entry.name),{ withFileTypes: true})).filter((entry) => { return entry.isDirectory()})
	if ((entry.name.length === 10) && (this.isValidDate(entry.name)) && (entry.name < retentionDate) && (subFolderList.length === 0)) {
	  console.log(new Date().toISOString(),'[RetentionManager]',`Removing ${path.join(entry.path,entry.name)}`)
	  return fsp.rm(path.join(entry.path,entry.name),{recursive: true, force: true })
	  /*
	  **
	  return new Promise((resolve,reject) => { resolve() })
	  **
	  */
	}
	else {
	  // console.log('SubFolders',subFolderList)
	  return subFolderList.map((entry) => {
	    return this.processFolder(entry,retentionDate)
	  })
	}
	} catch (e){ console.log(e)}
  }	
	  
  async cleanFolders(folderPath,retentionDate) {
    const directoryListing = (await fsp.readdir(folderPath,{ withFileTypes: true})).filter((entry) => { return entry.isDirectory() })
    const results = directoryListing.map((entry) => {return this.processFolder(entry,retentionDate)}).flat(10)
	await Promise.allSettled(results)
  }
  
  getMidnight(now) {

    const midnight = new Date(now.getTime())
    midnight.setDate(midnight.getDate()+1)
    midnight.setHours(0,0,0,0)
	return midnight
  }
    	 
  getTimeToMidnight() {

    const now = new Date()
    const midnight = this.getMidnight(now)
    const timeToMidnight = midnight.getTime() - now.getTime()
	return timeToMidnight
  }

  getRetentionDate(daysToKeep) {
	
    const retentionPeriodStart = this.getMidnight(new Date())
    retentionPeriodStart.setDate(retentionPeriodStart.getDate() - daysToKeep)
    const retentionDate = `${retentionPeriodStart.getFullYear()}-${(retentionPeriodStart.getMonth()+1).toString().padStart(2,'0')}-${retentionPeriodStart.getDate().toString().padStart(2,'0')}`
	return retentionDate 
  }
  
  async initialize(config) {

	// Wait for Midnight
	await setTimeout(this.getTimeToMidnight());

	let counter = 0
    this.cleanFolders(config.targetFolder,this.getRetentionDate(config.retentionPeriod.days)).then(() => {console.log(new Date().toISOString(),'[RetentionManager]','Iteration',counter)}).catch((e) => {console.log(new Date().toISOString(),'[RetentionManager][ERROR]',e)})
	const interval = 24 * 60 * 60 * 1000
    // for await (const i of setInterval(interval, counter++)) {
    for await (const i of setInterval(interval)) {
	  counter++
      this.cleanFolders(config.targetFolder,this.getRetentionDate(config.retentionPeriod.days)).then(() => {console.log(new Date().toISOString(),'[RetentionManager]','Iteration',counter)}).catch((e) => {console.log(new Date().toISOString(),'[RetentionManager][ERROR]',e)})
	}
  }
  
}

export {RetentionManager as default}
