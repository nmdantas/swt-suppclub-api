'use strict';

// Inicia as variaveis de ambiente
require('dotenv').config();

var express     = require('express');
var bodyParser  = require('body-parser');
var controllers = require('./../controllers');
var assert      = require('assert');
var request     = require('supertest');

var app = express();

app.use(bodyParser.json());

app.use(controllers.brand);

describe('GET /brands', function() {
    it('Obter todas as marcas', function(done) {
        request(app)
            .get('/brands')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});