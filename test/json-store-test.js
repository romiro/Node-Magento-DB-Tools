//var assert = require("assert");
var fs = require('fs');
var path = require('path');
var chai = require('chai');
var expect = chai.expect;

var JsonStore = require('../lib/json-store');


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

        describe('push scalar data', function(){
            it('should set without an error', function(){
                testStore.push('value1');
            });
        });

        describe('set data by key', function(){
            it('should set without an error', function(){
                testStore.set(1, 'value2');
            });
        });

        describe('save', function(){
            it('should save without an error and file should exist', function(){
                testStore.save();
                var fn = function () { fs.openSync(path.join(storageDir, 'test.json'), 'r+'); }

                expect(fn).to.not.throw(Error);
            });
        });

        describe('get', function(){
            it('should retrieve a value from supplied index', function(){
                var value = testStore.get(0);
                expect(value).to.equal('value1');
            });
        });

        describe('getAll', function(){
            it('should return all of the set keys', function() {
                var allData = testStore.getAll();
                expect(allData).to.deep.equal(['value1','value2']);
            });
        });

        describe('push complex data', function(){
            it('should set without an error', function(){
                testStore.push({name: 'value2', description: 'A test value'});
            });
        });

        describe('findBy', function(){
            it('should find data by searching a given property value', function(){
                var name = testStore.getBy('name', 'value2');
                expect(name).to.deep.equal({name: 'value2', description: 'A test value'});
            });
        });


    });

    /**
     * Cleanup test
     */
    after(function(){
        fs.unlinkSync(path.join(storageDir, 'test.json'));
        fs.unlinkSync(path.join('./lib', 'storage', 'test.json'));
    });
});