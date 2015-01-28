'use strict';

var Backbone = require('backbone');
var Hoard = require('src/backbone.hoard');
var Control = require('src/control');
var Store = require('src/store');
var MetaStore = require('src/meta-store');
var Policy = require('src/policy');
var Strategy = require('src/strategy');

describe("extend", function () {
  it("defaults to Backbone.Model.extend", function () {
    expect(Hoard.extend).to.equal(Backbone.Model.extend);
  });

  describe("overriding", function () {
    beforeEach(function () {
      Hoard.extend = this.sinon.stub();
    });

    it("Control.extend delegates to Hoard.extend", function () {
      Control.extend({}, {});
      expect(Hoard.extend).to.have.been.calledOnce
        .and.calledWith({}, {});
    });

    it("Store.extend delegates to Hoard.extend", function () {
      Store.extend({}, {});
      expect(Hoard.extend).to.have.been.calledOnce
        .and.calledWith({}, {});
    });

    it("MetaStore.extend delegates to Hoard.extend", function () {
      MetaStore.extend({}, {});
      expect(Hoard.extend).to.have.been.calledOnce
        .and.calledWith({}, {});
    });

    it("Policy.extend delegates to Hoard.extend", function () {
      Policy.extend({}, {});
      expect(Hoard.extend).to.have.been.calledOnce
        .and.calledWith({}, {});
    });

    it("Strategy.extend delegates to Hoard.extend", function () {
      Strategy.extend({}, {});
      expect(Hoard.extend).to.have.been.calledOnce
        .and.calledWith({}, {});
    });
  });
});