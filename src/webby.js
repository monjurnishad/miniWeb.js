// webby.js
const path = require('path');
const net = require('net');
const fs = require('fs');

const HTTP_STATUS_CODES = {
    200: 'OK',
    404: 'Not Found',
    500: 'Internal Server Error',
    308: 'Permanent Redirect'
}

const MIME_TYPES = {
    jpg: 'image/jpeg',
    jpeg : 'image/jpeg',
    png: 'image/png',
    html: 'text/html',
    css: 'text/css',
    text: 'text/plain'
}

const getExtension = fileName => {
    return path.extname(fileName).slice(1);
}

const getMIMEType = fileName => {
    const extension = getExtension(fileName);
    if(MIME_TYPES.hasOwnProperty(extension)){
        return MIME_TYPES[extension];
    }
    return '';
}

class Request {
    constructor(binaryData) {
      const req = '' + binaryData;
      const [method, path] = req.split(' ');  
      this.method = method;
      this.path = path;
    }
}

class Response {
    constructor(sock, statusCode = 200, version = 'HTTP/1.1'){
        this.sock = sock;
        this.statusCode = statusCode;
        this.version = version;
        this.headers = {};
    }

    set(name, value){
        this.headers[name] = value;
    }

    end(){
        this.sock.end();
    }

    statusLineToString(){
        return `${this.version} ${this.statusCode} ${HTTP_STATUS_CODES[this.statusCode]}\r\n`;
    }

    headersToString(){
        return Object.keys(this.headers).reduce((accum, ele) => {
            return accum + `${ele}: ${this.headers[ele]}\r\n`
        }, '');
    }

    send(body){
        if(!this.headers.hasOwnProperty('Content-Type')){
            this.headers['Content-Type'] = 'text/html';
        }
        
        this.sock.write(this.statusLineToString());
        this.sock.write(this.headersToString() + '\r\n');
        this.sock.write(body);
        this.end();
    }

    status(statusCode){
        this.statusCode = statusCode;
        return this;
    }
}

class App {
    constructor(){
        this.server = net.createServer(sock => this.handleConnection(sock));
        this.routes = {};  
        this.middleware = null;
    }
    
    normalizePath(path){
        path = path.toLowerCase();
        if(path.indexOf('?') > -1){
            path = path.slice(0, path.indexOf('?'));
        }
        else if(path.indexOf('#') > -1){
            path = path.slice(0, path.indexOf('#'));
        }

        return path[path.length - 1] == '/' ? path.slice(0, path.length - 1) : path;
    }

    createRouteKey(method, path){
        path = this.normalizePath(path);
        method = method.toUpperCase();
        return `${method} ${path}`;
    }

    get(path, cb){
        this.routes[this.createRouteKey('GET', path)] = cb;
    }

    use(cb){
        this.middleware = cb;
    }

    listen(port, host){
        this.server.listen(port, host);
    }

    handleConnection(sock){
        
        sock.on("error", (err) => {
            console.log("TCP CONNECTION ERROR");
        });

        sock.on('data', data => {
            this.handleRequest(sock, data)
        });

        /* sock.on('data', this.handleRequest.bind(this, sock)); */
    }

    handleRequest(sock, binaryData){
        const req = new Request(binaryData);
        const res = new Response(sock);
        
        if(this.middleware) {
            this.middleware(req, res, this.processRoutes.bind(this, req, res));
        } else {
            this.processRoutes(req, res);
        }
    }

    processRoutes(req, res){
        const router = this.createRouteKey(req.method, req.path);
        if(this.routes.hasOwnProperty(router)){
            this.routes[router](req, res);
        } else {
            res.status(404).send('Page not found')
        }
    }
}

const serveStatic = basePath => {
    return (req, res, next) => {
        const directory = path.join(basePath, req.path);
        fs.readFile(directory, (err, data) => {
            if(err){
                next();
            } else {
                res.headers['Content-Type'] = getMIMEType(directory);
                res.send(data);  
            }
        }); 
    };
};

module.exports = {
    HTTP_STATUS_CODES: HTTP_STATUS_CODES,
    MIME_TYPES: MIME_TYPES,
    getExtension: getExtension,
    getMIMEType: getMIMEType,
    Request: Request,
    Response: Response,
    App: App,
    static: serveStatic
}
// npx mocha test/webby-test.js