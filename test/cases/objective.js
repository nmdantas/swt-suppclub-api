/*
 * Product's tests
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-06 | Nicholas M. Dantas
 */

'use strict';

var assert  = require('assert');
var request = require('supertest');
var accessLayer = require('./../../data-access');
var app     = null;

describe('POST /objectives', function() {
    before('Feed data for objective', function(done) {
        console.log('    Feed data for objetive...');
        this.timeout(5000);

        // Database
        accessLayer.orm.sync({
            force: true
        }).then(function() {
            // Tags
            accessLayer.Tag.bulkCreate([
                { id: 1, name: 'Tag1' },
                { id: 2, name: 'Tag2' }
            ]).then(function(tags) {
                // Pronto para os testes
                done();
            }); 
        });   
    });

    it('Deve retornar 200 e criar um novo registro', function(done) {
        var mock = {
            name: 'Something',
            description: 'Description',
            tags: [1, 2]
        };
        
        request(app).post('/objectives')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            withoutname: 'Something',
            description: 'Description',
            tags: [1, 2]
        };
        
        request(app).post('/objectives')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe.skip('PUT /objectives', function() {
    it('Deve retornar 200 e atualizar um registro existente', function(done) {
        var mock = {
            name: 'Change'
        };
        
        request(app).put('/objectives/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            invalid: 'Nothing'
        };
        
        request(app).put('/objectives/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('GET /objectives', function() {
    it('Deve retornar 200 e listar todas os registros', function(done) {

        request(app).get('/objectives')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 200 e retornar apenas o registro selecionado', function(done) {

        request(app).get('/objectives/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).get('/objectives/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

describe.skip('DELETE /objectives', function() {
    it('Deve retornar 200 e excluir o registro', function(done) {
        
        request(app).delete('/objectives/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando tentar excluir um registro inativo', function(done) {

        request(app).delete('/objectives/1')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).delete('/objectives/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

module.exports = function(expressApp) {
    app = expressApp;
}