/*
 * Product business layer
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-05-06 | Nicholas M. Dantas
 */

'use strict';

var accessLayer = require('./../data-access');
var framework   = require('swt-framework');
var logManager  = framework.logger;

module.exports = {
    list: list,
    create:[
        preValidation,
        create
    ],
    update: [
        preValidation,
        update
    ],
    delete: destroy,
    uploadImage: uploadImage
};

function preValidation(req, res, next) {
    var constraints = framework.common.validation.requiredFor('name', 'brand', 'category');
    var validationErrors = framework.common.validation.validate(req.body, constraints);

    if (validationErrors) {
        var error = new framework.models.SwtError({ httpCode: 400, details: validationErrors });

        next(error);
    } else {
        next();
    }
}

function create(req, res, next) {
    var responseBody = {};

    accessLayer.orm.transaction(function(t) {
        return accessLayer.Product.create(req.body, { transaction: t }).then(function(product) {  

            return product.setBrand(req.body.brand, { transaction: t }).then(function() {

                return product.setCategory(req.body.category, { transaction: t }).then(function() {

                    return product.addTags(req.body.tags, { transaction: t }).then(function() {
                        var nutrients = req.body.nutrients || [];
                        
                        for (var i = 0; i < nutrients.length; i++) {
                            nutrients[i].ProductId = product.id;
                            nutrients[i].NutrientId = nutrients[i].id;
                        }

                        return accessLayer.ProductsNutrients.bulkCreate(nutrients).then(function(n) {
                            responseBody = product;
                        });

                        // return product.addNutrients(keys, { associations, transaction: t }).then(function() {
                        //     responseBody = product;
                        // });
                    })
                });
            });
        });
    }).then(function(result) {
        res.json(responseBody);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function update(req, res, next) {
    var id = req.params.id;
    
    accessLayer.Product.update(req.body, { where: { id: id, deletedAt: null } }).then(function(result) {
        if (result[0]) {
            res.end();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function destroy(req, res, next) {
    var id = req.params.id;

    accessLayer.Product.destroy({ where: { id: id } }).then(function(result) {
        if (result) {
            res.end();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function list(req, res, next) {
    var id = req.params.id;
    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    // Verifica se a seleção deve ser feita pelo id
    if (id) {
        accessLayer.Product.findById(id, { include: [ accessLayer.Brand, accessLayer.Category, accessLayer.Tag, accessLayer.Nutrient ] }).then(function(result) {
            if (result) {
                res.json(result);
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }            
        }, errorCallback);
    } else {
        accessLayer.Product.findAll().then(function(results) {
            var products = [];

            for (var i = 0; i < results.length; i++) {
                products.push(results[i].dataValues);
            }

            res.json(products);
        }, errorCallback);
    }
}

function uploadImage(req, res, next) {

    var image = req.body.images[0].imageBase64;

    framework.media.image.upload(image)
        .then(function (result) {
            console.log('** file uploaded to Cloudinary service');
            console.dir(result);

            res.json(result);
        }, function(error) {
            var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

            next(customError);
        });
}