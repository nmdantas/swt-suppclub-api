/*
 * Store's tests
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-06-15 | Nicholas M. Dantas
 */

'use strict';

var assert  = require('assert');
var request = require('supertest');
var accessLayer = require('./../../data-access');
var app     = null;

before('Feed data for store', function(done) {
    console.log('    Feed data for store...');
    this.timeout(5000);

    // Database
    accessLayer.orm.sync({
        force: true
    }).then(function() {
        // Store
        accessLayer.Store.bulkCreate([
            { id: 1, name: 'Loja I', nickname: 'N-I', cnpj: 'cnpj', sponsor: 's', sponsorDocument: 'sp', status: '1', open: true, email: 'store@store.com.br' },
            { id: 2, name: 'Loja II', nickname: 'N-II', cnpj: 'cnpj', sponsor: 's', sponsorDocument: 'sp', status: '1', open: true, email: 'store@store.com.br' },
            { id: 3, name: 'Loja III', nickname: 'N-III', cnpj: 'cnpj', sponsor: 's', sponsorDocument: 'sp', status: '1', open: true, email: 'store@store.com.br' }
        ]).then(function(stores) {
            // Store Users
            accessLayer.StoresUsers.bulkCreate([
                { storeId: 1, userId: 24 },
                { storeId: 2, userId: 24 },
                { storeId: 3, userId: 24 },
                { storeId: 1, userId: 27 },
                { storeId: 2, userId: 27 }
            ]).then(function(storesUsers) {
                done();
            });
        }); 
    });   
});

describe('GET /stores', function() {
    it('Deve retornar 200 e listar todas os registros', function(done) {

        request(app).get('/stores')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 200 e retornar apenas o registro selecionado', function(done) {

        request(app).get('/stores/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).get('/stores/10')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });

    it('Deve retornar 200 e retornar apenas o registro selecionado, por usuario', function(done) {

        request(app).get('/stores/user/24')
                    .set('Accept', 'application/json')
                    .expect(200, function(err, res) {
                        //console.log(res.body);
                        
                        if (res.body.length === 3) {
                            request(app).get('/stores/user/27')
                                        .set('Accept', 'application/json')
                                        .expect(200, function(err, res) {
                                            //console.log(res.body);

                                            if (res.body.length === 2) {
                                                done(err);
                                            } else {
                                                done(new Error('Retorno não esperado'));
                                            }
                                        });
                        } else {
                            done(new Error('Retorno não esperado'));
                        }
                    });
    });
});

module.exports = function(expressApp) {
    app = expressApp;
}