'use strict';

// Inicia as variaveis de ambiente
var b = require('dotenv').config({
    path: __dirname + '/.env-test'
});

console.log(b);
console.log(__dirname);


var accessLayer = require('./../data-access');

describe('SYNC DB', function() {
    it('INIT TESTS', function(done) {
        console.log('SYNC');

        accessLayer.orm.sync({
            force: true
        }).then(function() {
            console.log('It worked!');

            var express     = require('express');
            var bodyParser  = require('body-parser');
            var controllers = require('./../controllers');
            var assert      = require('assert');
            var request     = require('supertest');
            var app = express();

            app.use(bodyParser.json());

            app.use(controllers.brand);

            var mock = {
                name: 'SomeBrand'
            };

            describe('POST /brands', function() {
                it('Obter todas as marcas', function(done) {
                    request(app)
                        .post('/brands')
                        .send(mock)
                        .set('Accept', 'application/json')
                        .expect(200, function(err, res) {
                            console.log(res.body);

                            done();
                        });
                });
            });

            describe('GET /brands', function() {
                it('Obter todas as marcas', function(done) {
                    request(app)
                        .get('/brands')
                        .set('Accept', 'application/json')
                        .expect(200, function(err, res) {
                            console.log(res.body);

                            done();
                        });
                });
            });

            done();
        }, function(err) {
            console.log('An error occurred while creating the table:', err);

            done();
        });
    });
});

