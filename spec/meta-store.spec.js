'use strict';

var _ = require('underscore');
var Hoard = require('src/backbone.hoard');
var MetaStore = require('src/meta-store');

describe("MetaStore", function () {
  beforeEach(function () {
    Hoard.backend = {
      setItem: this.sinon.stub(),
      getItem: this.sinon.stub(),
      removeItem: this.sinon.stub()
    };

    this.metaStore = new MetaStore();

    this.key = 'key';
    this.meta = { meta: true };
    this.options = {};
    this.storedMeta = {};
    this.storedMeta[this.key] = this.meta;
    this.storedMetaString = JSON.stringify(this.storedMeta);
  });

  describe("set", function () {
    it("sets the meta for the key when the meta is empty", function () {
      this.metaStore.backend.getItem.withArgs(this.metaStore.key).returns(null);

      return this.metaStore.set(this.key, this.meta).then(function () {
        expect(this.metaStore.backend.setItem).to.have.been.calledOnce
          .and.calledWith(this.metaStore.key, this.storedMetaString);
      }.bind(this));
    });

    it("sets the meta for the key when the meta is populated", function () {
      var alreadyStored = { otherKey: { otherMeta: true }};
      this.metaStore.backend.getItem.withArgs(this.metaStore.key)
        .returns(JSON.stringify(alreadyStored));
      var newStoredMeta = _.extend(alreadyStored, this.storedMeta);

      return this.metaStore.set(this.key, this.meta).then(function () {
        expect(this.metaStore.backend.setItem).to.have.been.calledOnce
          .and.calledWith(this.metaStore.key, JSON.stringify(newStoredMeta));
      }.bind(this));
    });
  });

  describe("getAll", function () {
    it("returns all metadata", function () {
      this.metaStore.backend.getItem.withArgs(this.metaStore.key)
        .returns(this.storedMetaString);
      return expect(this.metaStore.getAll()).to.eventually.eql(this.storedMeta);
    });
  });

  describe("invalidate", function () {
    it("replaces the metadata, without the provided key", function () {
      this.metaStore.backend.getItem.withArgs(this.metaStore.key)
        .returns(this.storedMetaString);
      return this.metaStore.invalidate(this.key).then(function () {
        expect(this.metaStore.backend.setItem).to.have.been.calledOnce
          .and.calledWith(this.metaStore.key, JSON.stringify({}));
      }.bind(this));
    });
  });

  describe("invalidateAll", function () {
    beforeEach(function () {
      this.result = this.metaStore.invalidateAll();
      return this.result;
    });

    it("removes the metadata", function () {
      expect(this.metaStore.backend.removeItem).to.have.been.calledOnce
        .and.calledWith(this.metaStore.key);
    });

    it("returns a resolved promise", function () {
      return expect(this.result).to.be.fulfilled;
    });
  });
});
