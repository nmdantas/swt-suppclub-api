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
    uploadImage: [ 
        uploadImage,
        saveImage
    ]
};

function preValidation(req, res, next) {
    var constraints = framework.common.validation.requiredFor('name', 'brandId', 'categoryId');
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

            return product.setTags(req.body.tags, { transaction: t }).then(function(tags) {
                responseBody = product;
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
    var productUpToDate = {};

    accessLayer.orm.transaction(function(t) {
        return accessLayer.Product.update(req.body, { 
            transaction: t,  
            where: { 
                id: id, 
                deletedAt: null 
            }
        }).then(function() {
            return accessLayer.Product.findById(id, { transaction: t }).then(function(product) {

                return product.setTags(req.body.tags, { transaction: t }).then(function(tags) {
                    productUpToDate = product;
                });
            });
        });
    }).then(function(result) {
        res.json(productUpToDate);
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

            res.json(result);
            
            next();
        }, function(error) {
            var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

            next(customError);
        });
}

function saveImage(req, res, next) {

    
}