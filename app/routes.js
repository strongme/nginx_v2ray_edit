module.exports = function (app) {

  // Front end routes
  app.get('/', function (req, res) {
    res.render('index');
  });
  app.get('/nginx', function (req, res) {
    res.render('nginx');
  });
  app.get('/v2ray', function (req, res) {
    res.render('v2ray');
  });
}
