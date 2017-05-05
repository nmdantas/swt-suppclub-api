/*'use strict';

// Inicia as variaveis de ambiente
require('dotenv').config();

var express     = require('express');
var bodyParser  = require('body-parser');
var controllers = require('./../controllers');
var assert      = require('assert');
var request     = require('supertest');

var app = express();

app.use(bodyParser.json());

app.use(controllers.nutrient);

var mock = {
    name: 'Mock'
}

describe('POST /nutrients', function() {
    it('Obter todas os nutrientes', function(done) {
        request(app)
            .post('/nutrients')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});

describe('GET /nutrients', function() {
    it('Obter todas os nutrientes', function(done) {
        request(app)
            .get('/nutrients')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});*/