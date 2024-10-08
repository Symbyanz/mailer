const fs = require('fs')
const path = require('path')

const FileWorker = function () {

    //returns an array with file paths and names from the specified folder
    this.filePaths = function (dirPath) {
        return new Promise(resolve => {
            let filePaths = []
            fs.readdir(dirPath, (err, files) => {
                if (err || typeof files === 'undefined') {
                    resolve(false)
                } else {
                    files.forEach(fileName => {
                        filePaths.push({
                            filename: fileName,
                            path: `${dirPath}\\${fileName}`
                        })
                    })
                    resolve(filePaths)
                }
            })
        })
    }

    this.cleanDir = function (dirPath) {
        fs.readdir(dirPath, (err, files) => {
            if (err || typeof files === 'undefined') {
                console.log('files not found')
            } else {
                for (const file of files) {
                    fs.unlink(path.join(dirPath, file), err => {
                        if (err) console.log('files no deleted')
                    })
                }
            }
        })
    }
}

module.exports = FileWorker