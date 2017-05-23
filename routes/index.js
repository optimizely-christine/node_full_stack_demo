var express = require('express');
var passport = require('passport');
var router = express.Router();
var items = [];

var Converter = require("csvtojson").Converter;
var converter = new Converter({});
var filter_by = 'category';
var filter_on;
converter.fromFile("bin/items.csv",function(err,result){
  items = result;
});





var optly = require('optimizely-server-sdk');
var url = 'https://cdn.optimizely.com/json/7666523852.json';
var rp = require('request-promise');
var options = {uri: url, json: true};
var optimizely;
rp(options).then(function(datafile) {
  optimizely = optly.createInstance({datafile: datafile, skipJSONValidation: true})
});

router.get('/shop', isLoggedIn, function(req, res) {
  var userId = req.user._id.toString();
  var attributes = {device: 'desktop'};

  var variationKey = optimizely.activate('feature_rollout', userId, attributes);
  console.log(variationKey);
  if (variationKey === 'control') {
    // execute code for control
    filter_on = 'none';
  } else if (variationKey === 'enable_filtering') {
    // execute code for enable_filtering
    filter_on = 'block';
  } else {
    // execute default code
    filter_on = 'none';
  }

  res.render('shop.ejs', { user: req.user, filter_by: filter_by, filter_on: filter_on, data: items });
});

router.post('/buy', isLoggedIn, function(req, res) {
  var userId = req.user._id.toString();
  var price = parseInt(req.body.price) * 100;
  var attributes = {device: 'desktop'};
  var eventTags = {category: 'clothes', purchasePrice: price, revenue: price};

  //track Optimizely event
  optimizely.track('purchased_item', userId, attributes, eventTags);

  res.render('buy.ejs', { user: req.user });
});

























router.get('/', function(req, res, next) {
  res.render('index', { title: 'Optimizely' });
});

router.get('/login', function(req, res, next) {
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.get('/signup', function(req, res) {
  res.render('signup.ejs', { message: req.flash('loginMessage') });
});

router.get('/profile', isLoggedIn, function(req, res) {
  res.render('profile.ejs', { user: req.user });
});

router.post('/shop', isLoggedIn, function(req, res) {
  filter_by = req.body.filter

  items.sort(function(a, b) {
    if(filter_by == "price"){
      var priceA = parseInt(a[filter_by]);
      var priceB = parseInt(b[filter_by]);
      return priceA < priceB ? -1 : 1;
    } else {
      var nameA = a[filter_by].toUpperCase(); // ignore upper and lowercase
      var nameB = b[filter_by].toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
    }
    // names must be equal
    return 0;
  });

  res.render('shop.ejs', { user: req.user, filter_by: filter_by, filter_on: filter_on, data: items });
});

router.get('/logout', function(req, res) {
  req.logout();
  res.render('logout.ejs', { user: req.user });

});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/shop',
  failureRedirect: '/signup',
  failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/shop',
  failureRedirect: '/login',
  failureFlash: true,
}));

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/shop',
  failureRedirect: '/login',
  failureFlash: true,
}));

module.exports = router;

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}
