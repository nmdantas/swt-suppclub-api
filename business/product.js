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
    get: {
        all: getAll,
        byId: getById,
        byReference: getByReference
    },
    create:[
        preValidation,
        create
    ],
    update: [
        preValidation,
        update
    ],
    delete: destroy,
    deleteRelationship: destroyRelationship,
    uploadImage: [ 
        uploadImage,
        saveProductImage
    ],
    deleteImage: [ 
        deleteImage,
        destroyProductImage
    ]
};

function handleResponse(results, cache) {
    var products = [];

    for (var i = 0; i < results.length; i++) {
        var storeIndex = 0;
        var belongsToStore = 0;

        for (var j = 0; j < results[i].dataValues.Stores.length; j++) {
            var match = results[i].dataValues.Stores[j].id === cache.stores[0].id;

            if (match) {
                storeIndex = j;
            }

            belongsToStore |= match;
        }

        // Volta a variavel para o tipo boolean, pois quando
        // o operador "|=" é usado o retorno é um inteiro
        results[i].dataValues.belongsToStore = belongsToStore ? true : false;
        results[i].dataValues.storeIndex = storeIndex;
        products.push(results[i].dataValues);
    }

    return products;
}

function errorCallback(error, next) {
    var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

    next(customError);
}

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
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var responseBody = {};

    accessLayer.orm.transaction(function(t) {
        return accessLayer.Product.create(req.body, { transaction: t }).then(function(product) {  

            return product.setTags(req.body.tags, { transaction: t }).then(function(tags) {

                return accessLayer.ProductsStores.bulkCreate([{
                    storeId: cache.stores[0].id,
                    productId: product.dataValues.id,
                    reference: req.body.reference,
                    stock: req.body.stock || 0,
                    price: req.body.price || 0.0
                }], { transaction: t }).then(function(productsStores) {
                    responseBody = product;
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
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
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
                    
                    return accessLayer.ProductsStores.destroy({ where: { storeId: cache.stores[0].id, productId: id }}).then(function() {
                        
                        return accessLayer.ProductsStores.bulkCreate([{
                            storeId: cache.stores[0].id,
                            productId: id,
                            reference: req.body.reference,
                            stock: req.body.stock || 0,
                            price: req.body.price || 0.0
                        }], { transaction: t }).then(function(productsStores) {
                            productUpToDate = product;
                        });
                    });                    
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

function destroyRelationship(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var id = req.params.id;

    accessLayer.ProductsStores.destroy({ 
        where: { 
            productId: id,
            storeId: cache.stores[0].id
        } 
    }).then(function(result) {
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

function getAll(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = [];
    
    for (var i = 0; i < req.body.order.length; i++) {
        var index = req.body.order[i].column;
        var direction = req.body.order[i].dir
        var columnName = req.body.columns[index].data;
        
        order.push([columnName, direction]);
    }

    accessLayer.Product.findAndCountAll({ 
        include: [ { model: accessLayer.Brand, require: true }, { model: accessLayer.Category, require: true }, { model: accessLayer.Tag, require: false }, { model: accessLayer.Nutrient, require: false }, { model: accessLayer.Store, require: false } ],
        where: req.query,
        offset: offset,
        limit: limit,
        order: order
    }).then(function(result) {        
        var products = handleResponse(result.rows, cache);

        var returnedData = {
            draw: draw,
            recordsTotal: result.count,
            recordsFiltered: result.count,
            data: products
        }

        res.json(returnedData);
    }, function(error) {
        errorCallback(error, next);
    });
}

function getById(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var id = req.params.id;

    accessLayer.Product.findById(id, { include: [ accessLayer.Brand, accessLayer.Category, accessLayer.Tag, accessLayer.Nutrient, accessLayer.Store, { model: accessLayer.ProductImage, as: 'images'} ] }).then(function(result) {
        if (result) {
            var storeIndex = 0;
            var belongsToStore = 0;

            for (var i = 0; i < result.dataValues.Stores.length; i++) {
                var match = result.dataValues.Stores[i].id === cache.stores[0].id;

                if (match) {
                    storeIndex = i;
                }

                belongsToStore |= match;
            }

            // Volta a variavel para o tipo boolean, pois quando
            // o operador "|=" é usado o retorno é um inteiro
            result.dataValues.belongsToStore = belongsToStore ? true : false;
            result.dataValues.storeIndex = storeIndex;
            res.json(result);
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, function(error) {
        errorCallback(error, next);
    });
}

function getByReference(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var code = req.params.code;
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;

    accessLayer.ProductsStores.findAll({ 
        attributes: ['productId'],
        where: {
            storeId: cache.stores[0].id,
            reference: {
                $like: '%' + code + '%'
            }
        }
    }).then(function(productsStores) {
        var ids = [];

        for (var i = 0; i < productsStores.length; i++) {
            ids.push(productsStores[i].dataValues.productId);
        }
        
        // adiciona os ids relacionados à referencia no where junto com os demais filtros
        req.query.id = {
            $in: ids
        };
        
        accessLayer.Product.findAndCountAll({
            include: [ { model: accessLayer.Brand, require: true }, { model: accessLayer.Category, require: true }, { model: accessLayer.Tag, require: false }, { model: accessLayer.Nutrient, require: false }, { model: accessLayer.Store, require: false } ],
            where: req.query,
            offset: offset,
            limit: limit
        }).then(function(result) {
            var products = handleResponse(result.rows, cache);

            var returnedData = {
                draw: draw,
                recordsTotal: result.count,
                recordsFiltered: result.count,
                data: products
            }

            res.json(returnedData);
        }, function(error) {
            errorCallback(error, next);
        });
    }, function(error) {
        errorCallback(error, next);
    });
}

function uploadImage(req, res, next) {

    var image = req.body.images[0].imageBase64;

    framework.media.image.upload(image)
        .then(function (result) {
            console.log('** file uploaded to Cloudinary service');
            req.cloudionary = result;
            
            next();
        }, function(error) {
            var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

            next(customError);
        });
}

function saveProductImage(req, res, next) {

    accessLayer.ProductImage.create({
        public_id: req.cloudionary.public_id,
        phash: req.cloudionary.phash,
        secure_url: req.cloudionary.secure_url,
        url: req.cloudionary.url,
        ProductId: req.body.productId
    }).then(function(result) {
        res.json(result);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    });
}

function deleteImage(req, res, next) {

    var id = req.params.id;

    accessLayer.ProductImage.findById(id).then(function(result) {
        if (result) {
            req.image = result;
            framework.media.image.remove(result.public_id)
                .then(function (result) {
                    console.log('** file removed from Cloudinary service');
                    req.cloudionary = result;
                    
                    next();
                }, function(error) {
                    var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

                    next(customError);
                });

        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, errorCallback);
}

function destroyProductImage(req, res, next) {
    var id = req.image.id;

    accessLayer.ProductImage.destroy({ where: { id: id } }).then(function(result) {
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