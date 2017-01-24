var express = require('express');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const nunjucks = require('nunjucks');
var JSZip = require("jszip");
const moment = require('moment');
const nunjucksEnvFactory = require('./nunjucksEnvFactory');

var app = express();
app.use(bodyParser.json());

const nunjucksEnviroments = {
    gc: nunjucksEnvFactory('good-companies-templates')
};


const DEFAULT_BASE_DOCUMENT = 'base_documents/default.odt';

module.exports = function(config) {
    const port = config.server_port || 3000;

    app.listen(port, function () {
        console.log('Node server running at localhost:' + port);
    });

    app.post('/render', function (req, res) {
        let env;

        if (!!req.body.goodCompaniesTemplate) {
            env = nunjucksEnviroments.gc;
        }

        if (env) {
            const renderedContentXml = env.nunjucks.render('resignation_of_director.njk', req.body.values);//req.body.formName + '.njk', req.body.values);
            const filetype = req.body.values.fileType;
            const filename = !!req.body.values.filename ? req.body.values.filename : req.body.formName;

            packZip(renderedContentXml).then((zip) => {
                if (filetype != 'odt') {
                    // TODO: convert here
                }

                res.set('Content-Type', 'application/' + filetype);
                res.set('Content-Disposition', 'attachment; filename=' + filename + '.' + fileType);
                res.end(zip, 'binary');
            });
        } else {
            res.set('Content-Type', 'application/json');
            res.status(400);
            res.end('Error: unknown service');
        }
    });
}

function packZip(contentXml) {
    return fs.readFileAsync(DEFAULT_BASE_DOCUMENT)
        .then((odt) => {
            return JSZip.loadAsync(odt)
                .then((zip) => {
                    zip.file('content.xml', contentXml);
                    return zip.generateAsync({type: 'nodebuffer'});
                });
        })
        .catch(error => console.log(error));
}
