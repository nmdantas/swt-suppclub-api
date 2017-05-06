'use strict';

// Inicia as variaveis de ambiente seguindo as configuracoes de teste
require('dotenv').config({
    path: __dirname + '/.env-test'
});

var assert      = require('assert');
var request     = require('supertest');
var express     = require('express');
var bodyParser  = require('body-parser');
var controllers = require('./../controllers');
var accessLayer = require('./../data-access');

var doneCallback = null;
var defaultCallback = function(err, res) {
    console.log(res.body);
    
    if (typeof doneCallback === 'function') {
        doneCallback();
        doneCallback = null;
    }
}

var app = express();

app.use(bodyParser.json());

app.use(controllers.brand);

// Antes de realizar qualquer teste cria o banco de dados
before('Sync test database', function(done) {
    console.log('Syncing test database...\n');

    accessLayer.orm.sync({
        force: true
    }).then(function() {
        done();
    });
});

describe('POST /brands', function() {
    it('Criar uma nova marca', function(done) {
        doneCallback = done;

        var mock = {
            name: 'SomeBrand',
            description:'SomeDescription',
            status: 2
        };
        
        request(app).post('/brands')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, defaultCallback);
    });
});

describe('GET /brands', function() {
    it('Obter todas as marcas', function(done) {
        doneCallback = done;

        request(app).get('/brands')
                    .set('Accept', 'application/json')
                    .expect(200, defaultCallback);
    });
});