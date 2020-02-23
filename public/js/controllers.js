var ctrl = angular.module('controllers', ['directives']);

ctrl.controller('indexController', function ($scope) {
});

ctrl.controller('configController', function ($scope, $attrs) {
  var type = $attrs.type;
  var editor = ace.edit("editor");
  if (type === 'nginx') {
    editor.getSession().setMode("ace/mode/text");
  }else {
    editor.getSession().setMode("ace/mode/json");
  }


  var socket = io();

  socket.on('list-configs', function(files, typeParam) {
    if(type!==typeParam) return;
    $('#configList').empty();
    for (i in files) {
      $('#configList').append("<li><span class='configItem'>" + files[i] + "</span><span class='deleteItem'>&#10006;</span></li>");
    }
    $('.configItem').click(function() {
      var file = $(this).text();
      socket.emit('show-config', file, type);
    });
    $('.deleteItem').click(function() {
      var delcheck = confirm("Are you sure you want to delete this config?");
      if (delcheck) {
        var file = $(this).parent().children('.configItem').text();
        socket.emit('delete-config', file, type);
      }
    });
  });

  socket.on('show-config', function(obj) {
    editor.setValue(obj.data);
    $("#name").val(obj.file);
  });

  socket.on('load-config', function(obj) {
    editor.setValue(obj.data);
    $("#name").val(obj.file);
  });

  socket.on('error', function (err) {
    UIkit.notification({
      message: err,
      status: 'danger',
      pos: 'top-center',
      timeout: 8000
    });
  });

  socket.on('reload-success', function (stdout) {
    UIkit.notification({
      message: "nginx reloaded successfully",
      status: 'primary',
      pos: 'top-center',
      timeout: 5000
    });
  });

  socket.on('restart-success', function (stdout) {
    UIkit.notification({
      message: "nginx restarted successfully",
      status: 'primary',
      pos: 'top-center',
      timeout: 5000
    });
  });

  socket.on('syntax-success', function (stdout) {
    UIkit.notification({
      message: "syntax checked successfully",
      status: 'primary',
      pos: 'top-center',
      timeout: 5000
    });
  });

  $('#saveconfig').click(function() {
    var file = $('#name').val();
    console.log(file);
    if (file == "" || file == null) {
      alert("Please give your config a file name.");
    } else {
      var data = editor.getValue();
      var obj = {
        'file': file,
        'data': data
      };
      socket.emit('save-config', obj, type);
      UIkit.notification({
        message: "config saved",
        status: 'primary',
        pos: 'top-center',
        timeout: 3000
      });
    }
  });

  $('#newconfig').click(function() {
    $('#name').val("");
    editor.setValue("");
  });

  $('#reloadnginx').click(function () {
    var action = "reload"
    socket.emit('reload', action, type);
  });

  $('#restartnginx').click(function () {
    var action = "restart"
    socket.emit('restart', action, type);
  });

  $('#checksyntax').click(function () {
    var action = "check"
    socket.emit('check-syntax', action, type);
  });

  $('#loadconfig').click(function () {
    var action = "config"
    socket.emit('load-config', action, type);
  });

  $('#tonginx').click(function () {
    document.location = '/nginx';
  });
  $('#tov2ray').click(function () {
    document.location = '/v2ray';
  });
});

