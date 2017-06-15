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

describe('POST /products', function() {
    before('Feed data for product', function(done) {
        console.log('    Feed data for product...');
        this.timeout(5000);

        // Database
        accessLayer.orm.sync({
            force: true
        }).then(function() {
            // Brand
            accessLayer.Brand.bulkCreate([
                { id: 1, name: 'The Brand' },
                { id: 2, name: 'The Brand Part II' }
            ]).then(function(brands) {
                // Category
                accessLayer.Category.bulkCreate([
                    { id: 1, name: 'A Category' },
                    { id: 2, name: 'Another Category' }
                ]).then(function(category) {
                    // Tags
                    accessLayer.Tag.bulkCreate([
                        { id: 1, name: 'Tag1' },
                        { id: 2, name: 'Tag2' }
                    ]).then(function(tags) {
                        // Nutrients
                        accessLayer.Nutrient.bulkCreate([
                            { id: 1, name: 'Nutrient1' },
                            { id: 2, name: 'Nutrient2' }
                        ]).then(function(nutrients) {
                            // Pronto para os testes
                            done();
                        });;
                    });
                });
            }); 
        });   
    });

    it('Deve retornar 200 e criar um novo registro', function(done) {
        var mock = {
            name: 'Something',
            description: 'Description',
            contraindication: 'None',
            status: 'Available',
            brandId: 2,
            categoryId: 2,
            tags: [1, 2]
        };
        
        request(app).post('/products')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, function(err, res) {
                        //console.log(res.body);
                        // Valor Atualizado
                        if (res.body.brandId == 2 &&
                            res.body.categoryId == 2) {
                            done();
                        } else {
                            done(new Error('Registro não criado devidamente'));
                        }
                    });
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            name: 'Something',
            description: 'Description',
            contraindication: 'None',
            status: 'Available',
            invalidBrand: 1,
            invalidCategory: 1,
            tags: [1, 2]
        };
        
        request(app).post('/products')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('PUT /products', function() {
    it('Deve retornar 200 e atualizar um registro existente', function(done) {
        var mock = {
            name: 'Something Changed',
            description: 'New Description',
            contraindication: 'None',
            status: 'Available',
            brandId: 1, // Mudanca de marca
            categoryId: 1, // mudanca de categoria
            tags: [2]
        };
        
        request(app).put('/products/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(200, function(err, res) {
                        //console.log(res.body);
                        // Valor Atualizado
                        if (res.body.brandId == 1 &&
                            res.body.categoryId == 1) {
                            done();
                        } else {
                            done(new Error('Registro não atualizado'));
                        }
                    });
    });

    it('Deve retornar 400 quando a entrada for inválida', function(done) {
        var mock = {
            invalid: 'Nothing'
        };
        
        request(app).put('/products/1')
                    .send(mock)
                    .set('Accept', 'application/json')
                    .expect(400, done);
    });
});

describe('GET /products', function() {
    it('Deve retornar 200 e listar todas os registros', function(done) {

        request(app).get('/products')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 200 e retornar apenas o registro selecionado', function(done) {

        request(app).get('/products/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).get('/products/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

describe('DELETE /products', function() {
    it('Deve retornar 200 e excluir o registro', function(done) {
        
        request(app).delete('/products/1')
                    .set('Accept', 'application/json')
                    .expect(200, done);
    });

    it('Deve retornar 404 quando tentar excluir um registro inativo', function(done) {

        request(app).delete('/products/1')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });

    it('Deve retornar 404 quando não encontrar o registro', function(done) {

        request(app).delete('/products/2')
                    .set('Accept', 'application/json')
                    .expect(404, done);
    });
});

module.exports = function(expressApp) {
    app = expressApp;
}