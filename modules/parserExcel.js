const parser = require('read-excel-file/node');


const parserExcel = function (file) {
    return new Promise((resolve, reject) => {
        let elements = []
        parser(file).then(rows => {
            rows.forEach(col => {
                col.forEach(data => {
                    if (data != null) elements.push(data);
                })
            })
            resolve(elements)
        })
    })
}

module.exports = parserExcel;