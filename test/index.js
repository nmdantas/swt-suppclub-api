/*
 * Main entry for tests
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-06 | Nicholas M. Dantas
 */

'use strict';

// Inicia as variaveis de ambiente seguindo as configuracoes de teste
require('dotenv').config({
    path: __dirname + '/.env-test'
});

var request     = require('supertest');
var express     = require('express');
var bodyParser  = require('body-parser');
var framework   = require('swt-framework');
var controllers = require('./../controllers');
var accessLayer = require('./../data-access');

var app = express();

app.use(bodyParser.json());

// Verificacoes no Header Authorization
//app.use(framework.security.checkAuthorization);

app.use(controllers.brand);
app.use(controllers.nutrient);
app.use(controllers.category);
app.use(controllers.tag);
app.use(controllers.product);

app.use(framework.logger.middleware);

// Antes de realizar qualquer teste cria o banco de dados
before('Sync test database', function(done) {
    console.log('Syncing test database...\n');

    accessLayer.orm.sync({
        force: true
    }).then(function() {
        done();
    });
});

// Marcas
require('./cases/brand')(app);
// Nutrientes
require('./cases/nutrient')(app);
// Categorias
require('./cases/category')(app);
// Tags
require('./cases/tag')(app);
// Produtos
require('./cases/product')(app);