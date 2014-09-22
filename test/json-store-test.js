var assert = require("assert");
var JsonStore = require('../lib/json-store');

var fs = require('fs');
var path = require('path');

/* Test variable fixtures */
var storageDir = path.normalize(path.join(__dirname, 'storage'));


describe('Json Store', function(){
    describe('instantiate with no options', function(){
        var testStore;
        it('should instantiate without an error', function(){
            testStore = new JsonStore('test');
        });
    });

    describe('with custom options', function(){
        var testStore;
        describe('instantiate with custom storage directory defined', function(){
            it('should instantiate without an error', function(){
                testStore = new JsonStore('test', {storageDir: storageDir});
            });
        });

        describe('connect', function(){
            it('should connect without an error', function(){
                testStore.connect();
            });
        });

        describe('set data by key', function(){
            it('should set without an error', function(){
                testStore.set('key', 'value');
            });
        });

        describe('save', function(){
            it('should save without an error and file should exist', function(){
                testStore.save();
                var fd = fs.openSync(path.join(storageDir, 'test.json'), 'r+');
                assert(fd !== false);
            });
        });

        describe('get', function(){
            it('should retrieve a value from supplied key', function(){
                var value = testStore.get('key');
                assert(value === 'value');
            });
        });
    });






});