/**
 * uploader box
 *
 * 1 html5 only
 * 2 support multi-upload
 * 3 support drag & drop
 * 4 beautiful ui
 * Created by zhaobao on 10/22/16.
 */

require('./uploader.scss');

const STATUS_WAITING = 1;
const STATUS_UPLOADING = 2;
const STATUS_SUCCESS = 3;
const STATUS_ERROR = 4;

class Option {
    constructor(options) {
        this.url = options.hasOwnProperty('url') ? options.url : '';
        this.accept = options.hasOwnProperty('accept') ? options.accept : '*/*';
        this.multiple = options.hasOwnProperty('multiple') ? 'multiple' : '';
        this.data = options.hasOwnProperty('data') ? options.data : {};
        this.onprepare = options.hasOwnProperty('onprepare') ? options.onprepare : function() {};
        this.onsuccess = options.hasOwnProperty('onsuccess') ? options.onsuccess : function() {};
        this.onerror = options.hasOwnProperty('onerror') ? options.onerror : function() {};
    }
}

class Util {
    static getSuffix(file) {
        if (file.type === "") {
            if (file.name.lastIndexOf('.') >= 0) {
                return file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase().substr(0, 4);
            }
        } else {
            return file.type.split("/")[1].toUpperCase().substr(0, 4);
        }
    }
    static isEmptyObject(obj) {
        if (obj == null) return true;
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;
        if (typeof obj !== "object") return true;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) { return false; }
        }
        return true;
    }
    static getUuid() {
        return ++Util.uuid;
    }
}
Util.uuid = 0;

class Template {

    static getContainer() {
        return (`
            <div class="upload">
                <div class="upload__header">
                    <div class="upload__title">FILE UPLOAD</div>
                    <div class="upload__close">╳</div>
                </div>
                <div class="upload__body"></div>
                <div class="upload__footer">
                    <div class="upload__drag">
                        <div class="upload__area">
                            <!--<span>Drag files here or</span>-->
                            <span class="upload-area__browse">Click to browse</span>
                        </div>
                    </div>
                    <div class="upload__do disable">☂</div>
                </div>
                <div class="upload__form hide"></div>
            </div>`
        );
    }

    static getItem(suffix, name, size, id) {
        let item = document.createElement('div');
        item.classList.add('upload-item');
        item.classList.add('upload-item-' + id);
        item.innerHTML = `
            <div class="upload-item__icon">${suffix}</div>
            <div class="upload-item__body">
                <div class="upload-item__info">
                    <div class="upload-item__name">${name}</div>
                    <div class="upload-item__status">${size}</div>
                    <div class="upload-item__result" data-target="${id}">╳</div>
                </div>
                <div class="upload-item__pg">
                    <div class="upload-item-pg-bg"></div>
                    <div class="upload-item-pg-hl"></div>
                </div>
            </div>`;
        return item;
    }

    static getHiddenForm(accept, multiple) {
        return (`<input type="file" accept="${accept}" class="upload__input" ${multiple}/>`);
    }
}

class Uploader {

    constructor(container, options) {
        this.$container = typeof(container) === 'string' ? document.querySelector(container) : container;
        this._options = new Option(options);
        this.__files = {};
    }

    do() {
        this.$container.style.minHeight = '160px';
        this.$container.innerHTML = Template.getContainer();
        this.$upload = this.$container.querySelector('.upload');
        this.$form = this.$upload.querySelector('.upload__form');
        this.$form.innerHTML = Template.getHiddenForm(this._options.accept, this._options.multiple);
        this.__cacheSelector();
        this.__bindEvent();
        return this;
    }

    __cacheSelector() {
        this.$body = this.$upload.querySelector('.upload__body');
        this.$close = this.$upload.querySelector('.upload__close');
        this.$drag = this.$upload.querySelector('.upload__drag');
        this.$do = this.$upload.querySelector('.upload__do');
        this.$input = this.$upload.querySelector('.upload__input');
    }

    __bindEvent() {
        this.$close.addEventListener('click', function() {
            this.$container.parentNode.removeChild(this.$container);

        }.bind(this), false);
        this.$drag.addEventListener('click', function() {
            this.$input.click();
        }.bind(this), false);
        this.$input.addEventListener('change', function(e) {
            this.__generateItem(e.target.files);
            e.target.value = '';
        }.bind(this), false);
        this.$do.addEventListener('click', function(e) {
            if (!Util.isEmptyObject(this.__files)) {
                this.__doUpload();
            }
        }.bind(this), false);
        this.$body.addEventListener('click', function(e) {
            console.log(this.__files);
            console.log(e.target);
            if (e.target.classList.contains('upload-item__result')) {
                let index = e.target.getAttribute('data-target');
                if (this.__files.hasOwnProperty('item-' + index)) delete this.__files['item-' + index];
                if (Util.isEmptyObject(this.__files)) this.__toggleUploadBtn(false);
                this.$body.removeChild(document.querySelector('.upload-item-' + index));
            }
        }.bind(this), false)
    }

    __generateItem(files) {
        if (files.length === 0) {
            return;
        }
        this.__toggleUploadBtn(true);
        for (let i = 0, l = files.length; i < l; i++) {
            let file = files[i];
            let id = Util.getUuid();
            this.$body.appendChild(Template.getItem(Util.getSuffix(file), file.name, file.size, id));
            this.__files['item-' + id] = {
                'status': STATUS_WAITING,
                'file': file,
                'container': document.querySelector('.upload-item-' + id)};
        }
    }

    __doUpload() {
        for (let key in this.__files) {
            if (!this.__files.hasOwnProperty(key)) continue;
            if (this._options.hasOwnProperty('onprepare') && typeof this._options.onprepare === 'function') {
                this._options.onprepare(this.__files[key]);
            }
            if (this.__files[key]['status'] !== STATUS_WAITING) {
                continue;
            }
            this.__files[key]['status'] = STATUS_UPLOADING;
            let xhr = new XMLHttpRequest();
            let fd = new FormData();
            let $progress = this.__files[key]['container'].querySelector('.upload-item-pg-hl');
            let $size = this.__files[key]['container'].querySelector('.upload-item__status');
            let index = this.__files[key]['container'].querySelector('.upload-item__result').getAttribute('data-target');
            xhr.upload.addEventListener('progress', function(e) {
                if (e['lengthComputable']) {
                    let total = this.__files[key]['file']['size'];
                    let loaded = e.loaded;
                    if (loaded > total) loaded = total;
                    let percentage = Math.round((loaded * 100) / total);
                    $progress.style.width = percentage + "%";
                    $size.innerHTML = loaded + ' / ' + total;
                } else {
                    $progress.classList.add('unknown');
                }
            }.bind(this), false);
            xhr.upload.addEventListener('load', function() {
                $progress.style.width = '100%';
            }, false);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        this.__files[key]['status'] = STATUS_SUCCESS;
                        $size.innerHTML = "success";
                        $size.classList.add('upload-item__status-success');
                        delete this.__files['item-' + index];
                        if (this._options.hasOwnProperty('onsuccess') && typeof this._options.onsuccess === 'function') {
                            this._options.onsuccess(xhr);
                        }
                    } else {
                        this.__files[key]['status'] = STATUS_ERROR;
                        if (this._options.hasOwnProperty('onerror') && typeof this._options.onerror === 'function') {
                            this._options.onsuccess(xhr);
                        }
                    }
                }
            }.bind(this);
            fd.append('file', this.__files[key]['file']);
            if (this._options.hasOwnProperty('data')) {
                for (let key in this._options['data']) {
                    if (this._options['data'].hasOwnProperty(key)) {
                        fd.append(key, this._options['data'][key])
                    }
                }
            }
            xhr.open('POST', this._options['url'], true);
            xhr.send(fd);
        }
    }

    __toggleUploadBtn(enable) {
        this.$do.classList[enable ? "remove" : "add"]('disable');
    }

}

module.exports = Uploader;
