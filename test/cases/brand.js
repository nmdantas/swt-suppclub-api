/*
 * Brand's tests
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-06 | Nicholas M. Dantas
 */

'use strict';

var assert  = require('assert');
var request = require('supertest');
var app     = null;

describe('POST /brands', function() {
    it('Deve retornar 200 e criar um novo registro', function(done) {
        var mock = {
            name: 'SomeBrand'
        };
        
        request(app).post('/brands')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            invalid: 'SomeBrand'
        };
        
        request(app).post('/brands')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('PUT /brands', function() {
    it('Deve retornar 200 e atualizar um registro existente', function(done) {
        var mock = {
            name: 'AnotherBrand',
            description: 'Something'
        };
        
        request(app).put('/brands/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            invalid: 'AnotherBrand'
        };
        
        request(app).put('/brands/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('GET /brands', function() {
    it('Deve retornar 200 e listar todas os registros', function(done) {

        request(app).get('/brands')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 200 e retornar apenas o registro selecionado', function(done) {

        request(app).get('/brands/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).get('/brands/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

describe.skip('DELETE /brands', function() {
    it('Deve retornar 200 e excluir o registro', function(done) {
        
        request(app).delete('/brands/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando tentar excluir um registro inativo', function(done) {

        request(app).delete('/brands/1')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).delete('/brands/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

module.exports = function(expressApp) {
    app = expressApp;
}