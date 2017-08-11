/*
 * App's tests
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-06 | Nicholas M. Dantas
 */

'use strict';

var assert  = require('assert');
var request = require('supertest');
var accessLayer = require('./../../data-access');
var app     = null;

describe('POST /objectives/user', function() {
    before('Feed data for objective', function(done) {
        console.log('    Feed data for objetive users...');
        this.timeout(5000);

        // Database
        accessLayer.orm.sync({
            force: true
        }).then(function() {
            // Objective
            accessLayer.Objective.bulkCreate([
                { id: 1, name: 'Objetivo 1', description: 'Descrição Objetivo 1' },
                { id: 2, name: 'Objetivo 2', description: 'Descrição Objetivo 2' },
                { id: 3, name: 'Objetivo 3', description: 'Descrição Objetivo 3' },
                { id: 4, name: 'Objetivo 4', description: 'Descrição Objetivo 4' }
            ]).then(function(objectives) {
                
                accessLayer.ObjectivesUsers.bulkCreate([
                    { userId: 1, objectiveId: 1 },
                    { userId: 1, objectiveId: 2 },
                    { userId: 2, objectiveId: 3 },
                    { userId: 2, objectiveId: 4 }
                ]).then(function(objectivesUsers) {
                    // Pronto para os testes
                    done();
                });
            }); 
        });   
    });

    it('Deve retornar 200 e criar um novo registro', function(done) {
        var mock = {
            userId: 1,
            objectiveId: 3
        };
        
        request(app).post('/objectives/user')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            userId: 1
        };
        
        request(app).post('/objectives/user')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('GET /objectives/user', function() {
    it('Deve retornar 200 e listar todas os registros', function(done) {

        request(app).get('/objectives/user')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });
});

module.exports = function(expressApp) {
    app = expressApp;
}