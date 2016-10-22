/**
 * uploader demo
 * Created by zhaobao on 10/22/16.
 */

const Uploader = require('./uploader');
new Uploader('.upload-container', {
    'url': 'http://127.0.0.1:9999',
    'data': {},
    'multiple': true,
    'onprepare': function() {
        console.log(arguments);
    },
    'onsuccess': function() {
        console.log(arguments);
    },
    'onerror': function() {
        console.log(arguments);
    }
}).do();
