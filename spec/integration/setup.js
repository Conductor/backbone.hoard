'use strict';

// loaded by karma to include fakeServer
var sinon = window.sinon;
delete window.sinon;
var chai = require('chai');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');
var Backbone = require('backbone');
var Hoard = require('src/build/backbone.hoard.bundle');
var asyncLocalStorage = require('./async-local-storage');

// load specs
var readSpecs = require('./read.int-spec.js');
var writeSpecs = require('./write.int-spec.js');

readSpecs('localStorage', localStorage);
writeSpecs('localStorage', localStorage);
readSpecs('asyncLocalStorage', asyncLocalStorage);
writeSpecs('asyncLocalStorage', asyncLocalStorage);

window.expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

beforeEach(function () {
  this.server = sinon.fakeServer.create();
  this.server.autoRespond = true;
  this.sinon = sinon.sandbox.create();

  this.requests = {};

  this.storeRequest = function (xhr) {
    var requestKey = xhr.method + ':' + xhr.url;
    var urlRequests = this.requests[requestKey] || [];
    urlRequests.push(xhr);
    this.requests[requestKey] = urlRequests;
  };
});

afterEach(function () {
  this.server.restore();
  this.sinon.restore();
  localStorage.clear();
});
