'use strict';

var _ = require('underscore');

var Hoard = require('./backbone.hoard');
var Store = require('./store');
var Policy = require('./policy');
var CreateStrategyClass = require('./create-strategy');
var ReadStrategyClass = require('./read-strategy');
var UpdateStrategyClass = require('./update-strategy');
var PatchStrategyClass = require('./patch-strategy');
var DeleteStrategyClass = require('./delete-strategy');

// Configuration information to ease the creation of Strategy classes
var strategies = {
  create: {
    klass: CreateStrategyClass,
    classProperty: 'createStrategyClass',
    property: 'createStrategy'
  },

  read: {
    klass: ReadStrategyClass,
    classProperty: 'readStrategyClass',
    property: 'readStrategy'
  },

  update: {
    klass: UpdateStrategyClass,
    classProperty: 'updateStrategyClass',
    property: 'updateStrategy'
  },

  patch: {
    klass: PatchStrategyClass,
    classProperty: 'patchStrategyClass',
    property: 'patchStrategy'
  },

  'delete': {
    klass: DeleteStrategyClass,
    classProperty: 'deleteStrategyClass',
    property: 'deleteStrategy'
  }
};

var mergeOptions = _.union(['storeClass', 'policyClass'],
  _.pluck(strategies, 'classProperty'));

var strategyClasses = {};
_.each(strategies, function (strategy) {
  strategyClasses[strategy.classProperty] = strategy.klass;
});

// A Control is the entry point for caching behavior.
// It serves as a means of grouping the configured Store, Policy, and Strategies,
// all of which contain the main caching logic
var Control = function (options) {
  _.extend(this, _.pick(options || {}, mergeOptions));
  var defaultClasses = _.extend({
    storeClass: Store,
    policyClass: Policy
  }, strategyClasses);
  _.defaults(this, defaultClasses);

  // Create and assign a store and policy
  this.store = new this.storeClass(options);
  this.policy = new this.policyClass(options);

  // For each sync method, create and assign a strategy to this Control
  // Each strategy has access to this Control's store and policy
  var strategyOptions = _.extend({}, options, {
    store: this.store,
    policy: this.policy
  });
  _.each(strategies, function (strategy) {
    this[strategy.property] = new this[strategy.classProperty](strategyOptions);
  }, this);

  this.initialize.apply(this, arguments);
};

_.extend(Control.prototype, Hoard.Events, {
  initialize: function () {},

  // For the given sync method, execute the matching Strategy
  sync: function (method, model, options) {
    var strategyProperty = strategies[method].property;
    var strategy = this[strategyProperty];
    return strategy.execute(model, options);
  },

  // The main use of Hoard
  // Return a sync method fully configured for the cache behavior of this Control
  getModelSync: function () {
    var modelSync = _.bind(this.sync, this);
    modelSync.hoardControl = this;
    return modelSync;
  }
});

Control.extend = Hoard.extend;

module.exports = Control;
