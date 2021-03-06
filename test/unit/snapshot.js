'use strict';

var expect   = require('chai').use(require('sinon-chai')).expect;
var sinon    = require('sinon');
var Snapshot = require('../../src/snapshot');
var Firebase = require('../..').MockFirebase;

describe('DataSnapshot', function () {

  var ref;
  beforeEach(function () {
    ref = new Firebase();
  });

  describe('#ref', function () {

    it('returns the reference', function () {
      expect(new Snapshot(ref).ref()).to.equal(ref);
    });

  });

  describe('#val', function () {

    it('returns a deep clone of the data', function () {
      var data = {
        foo: {
          bar: 'baz'
        }
      };
      var snapshot = new Snapshot(ref, data);
      expect(snapshot.val()).to.deep.equal(data);
      expect(snapshot.val()).to.not.equal(data);
      expect(snapshot.val().foo).to.not.equal(data.foo);
    });

    it('returns null for an empty object', function () {
      expect(new Snapshot(ref, {}).val()).to.equal(null);
    });

  });

  describe('#getPriority', function () {

    it('returns the priority', function () {
      expect(new Snapshot(ref, {}, 1).getPriority()).to.equal(1);
    });

  });

  describe('#child', function () {

    it('generates a snapshot for a child ref', function () {
      var parent = new Snapshot(ref);
      var child = parent.child('key');
      expect(parent.ref().child('key')).to.equal(child.ref());
    });

    it('uses child data', function () {
      var parent = new Snapshot(ref, {key: 'val'});
      var child = parent.child('key');
      expect(child.val()).to.equal('val');
    });

    it('uses null when there is no child data', function () {
      var parent = new Snapshot(ref);
      var child = parent.child('key');
      expect(child.val()).to.equal(null);
    });

    it('passes the priority', function () {
      var parent = new Snapshot(ref);
      ref.child('key').setPriority(10);
      ref.flush();
      var child = parent.child('key');
      expect(child.getPriority()).to.equal(10);
    });

  });

  describe('#forEach', function () {

    it('calls the callback with each child', function () {
      var snapshot = new Snapshot(ref, {
        foo: 'bar',
        bar: 'baz'
      });
      var callback = sinon.spy();
      snapshot.forEach(callback);
      expect(callback.firstCall.args[0].val()).to.equal('bar');
      expect(callback.secondCall.args[0].val()).to.equal('baz');
    });

    it('can set a this value', function () {
      var snapshot = new Snapshot(ref, {
        foo: 'bar'
      });
      var callback = sinon.spy();
      var context = {};
      snapshot.forEach(callback, context);
      expect(callback).to.always.have.been.calledOn(context);
    });

  });

  describe('#hasChild', function () {

    it('can handle null snapshots', function () {
      expect(new Snapshot(ref, null).hasChild('foo')).to.be.false;
    });

    it('tests for the key', function () {
      var snapshot = new Snapshot(ref, {foo: 'bar'});
      expect(snapshot.hasChild('foo')).to.be.true;
      expect(snapshot.hasChild('bar')).to.be.false;
    });

  });

  describe('#hasChildren', function () {

    it('tests for children', function () {
      expect(new Snapshot(ref).hasChildren()).to.be.false;
      expect(new Snapshot(ref, {foo: 'bar'}).hasChildren()).to.be.true;
    });

  });

  describe('#key', function () {

    it('returns the ref key', function () {
      expect(new Snapshot(ref).key()).to.equal(ref.key());
    });

  });

  describe('#name', function () {

    it('passes through to #key', function () {
      var snapshot = new Snapshot(ref);
      expect(snapshot.key()).to.equal(snapshot.name());
    });

  });

  describe('#numChildren', function () {

    it('returns the object size', function () {
      expect(new Snapshot(ref, {foo: 'bar'}).numChildren()).to.equal(1);
    });

    it('returns 0 for a null snapshot', function () {
      expect(new Snapshot(ref, null).numChildren()).to.equal(0);
    });

  });

  describe('#exportVal', function () {

    it('handles primitives with no priority', function () {
      expect(new Snapshot(ref, 'Hello world!').exportVal()).to.equal('Hello world!');
    });

    it('handles primitives with priorities', function () {
      expect(new Snapshot(ref, 'hw', 1).exportVal()).to.deep.equal({
        '.value': 'hw',
        '.priority': 1
      });
    });

    it('recursively builds an export object', function () {
      ref.set({
        foo: 'bar',
        bar: 'baz'
      });
      ref.child('bar').setPriority(1);
      ref.flush();
      expect(new Snapshot(ref, {
        foo: 'bar',
        bar: 'baz'
      }, 10).exportVal())
      .to.deep.equal({
        '.priority': 10,
        foo: 'bar',
        bar: {
          '.value': 'baz',
          '.priority': 1
        }
      });
    });

  });

});
