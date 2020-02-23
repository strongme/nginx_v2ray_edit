var fs = require('fs');
var exec = require('child_process').exec;
var configpath = __dirname + '/config.json'
var config = require(configpath);
var path = require('path');

var walk = require('walk');
global.nginxFiles = [];
global.v2rayFiles = [];

const NGINX = 'nginx';
const V2RAY = 'v2ray';


function getFolder(type) {
  return type === NGINX ? config.config_nginx_folder : config.config_v2ray_folder;
}

function getFiles(type) {
  return type === NGINX ? nginxFiles : v2rayFiles;
}

function listFiles(type) {
  if (type === NGINX) {
    global.nginxFiles = [];
  } else {
    global.v2rayFiles = [];
  }

  var options;
  var walker;

  options = {
    listeners: {
      file: function (root, stat, next) {
        var tmp = path.join(root, stat.name);
        if (type === NGINX) {
          global.nginxFiles.push(tmp.replace(getFolder(type), '').replace('/', ''));
        } else {
          global.v2rayFiles.push(tmp.replace(getFolder(type), '').replace('/', ''));
        }
        next();
      }
    }
  };

  if (type === NGINX) {
    walker = walk.walkSync(config.config_nginx_folder, options);
  } else {
    walker = walk.walkSync(config.config_v2ray_folder, options);
  }


}

module.exports = function (io) {
  io.on('connection', function (client) {
    console.log(client.request.connection.remoteAddress + " Client connected");

    listFiles(NGINX);
    listFiles(V2RAY);

    io.emit('list-configs', getFiles(NGINX), NGINX);
    io.emit('list-configs', getFiles(V2RAY), V2RAY);

    client.on('show-config', function (file, type) {
      fs.readFile(path.join(getFolder(type), file), 'utf8', function (err, data) {
        var obj = {'file': file, 'data': data};
        io.emit('show-config', obj);
      });
    });

    client.on('save-config', function (obj, type) {
      var title = obj.file;
      var filename = "";
      if (title == configpath) {
        filename = configpath
      } else {
        filename = path.join(getFolder(type), obj.file);
      }
      fs.writeFile(filename, obj.data, function (err) {
        console.log(client.request.connection.remoteAddress + " config " + type + " saved - " + obj.file);
        listFiles()
        io.emit('list-configs', getFiles(type), type);
      });
    });

    client.on('delete-config', function (file, type) {
      fs.unlink(getFolder(type) + file, function () {
        console.log(client.request.connection.remoteAddress + " config deleted - " + file);
        listFiles()
        io.emit('list-configs', getFiles(type), type);
      });
    });

    client.on('reload', function (action, type) {
      var command = type === NGINX ? "nginx -s reload" : "systemctl restart v2ray";
      exec(command, function (err, stdout, stderr) {
        if (err) {
          io.emit('error', err.toString());
        } else {
          io.emit('reload-success', stdout);
          console.log(client.request.connection.remoteAddress + " reload-success");
        }
      });
    });

    client.on('restart', function (action, type) {
      var command = type === NGINX ? "systemctl restart nginx" : "systemctl restart v2ray";
      exec(command, function (err, stdout, stderr) {
        if (err) {
          io.emit('error', err.toString());
        } else {
          io.emit('restart-success', stdout);
          console.log(client.request.connection.remoteAddress + " restart-success");
        }
      });
    });

    client.on('check-syntax', function (action, type) {
      var command = type===NGINX?"nginx -t":"/usr/bin/v2ray/v2ray  -test -config="+getFolder(type)+"/config.json";
      exec(command, function (err, stdout, stderr) {
        if (err) {
          io.emit('error', err.toString());
        } else {
          io.emit('syntax-success', stdout);
        }
      });
    });

    client.on('load-config', function (action) {
      fs.readFile(configpath, 'utf8', function (err, data) {
        var obj = {'file': configpath, 'data': data};
        io.emit('load-config', obj);
      });
    });
  });
}
