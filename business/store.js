/*
 * Store business layer
 * 
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

var accessLayer = require('./../data-access');
var framework   = require('swt-framework');
var logManager  = framework.logger;

module.exports = {
    get: {
        all: getAll,
        byId: getById,
        byUser: getByUser,
        byProduct: [
            getByProduct,
            getAll
        ],
        storeShift: [
            isAllowed,
            getById,
            changeSession
        ]
    },
    update: {
        data: [
            preValidation,
            isAllowed,
            hasSameRegistered,
            update
        ],
        open: updateOpen
    }
};

function errorCallback(error, next) {
    var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

    next(customError);
}

function preValidation(req, res, next) {
    var constraints = framework.common.validation.requiredFor('name','nickname','email','cnpj','sponsor','status');
    var validationErrors = framework.common.validation.validate(req.body, constraints);

    if (validationErrors) {
        var error = new framework.models.SwtError({ httpCode: 400, details: validationErrors });

        next(error);
    } else {
        next();
    }
}

function isAllowed(req, res, next) {
    var id = req.params ? req.params.id : 0;
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);

    accessLayer.StoresUsers.findAll({
        where: { 
            storeId: id,
            userId: cache.user.id
        }
    }).then(function(result){
        if (result) {
            next();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 410, message: 'Você não tem permissão para editar os dados dessa loja.' });
            next(customError);
        }
    }, errorCallback);
}

function hasSameRegistered(req, res, next) {
    var varId = req.body.id || 0;
    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    accessLayer.Store.findAll({ 
        where: {
            id: { $ne: varId }, 
            name: { $like: req.body.name  }
        }
    }).then(function(result) {
        if (result) {

            if (result.length > 0) {
                var customError = new framework.models.SwtError({ httpCode: 400, message: 'Loja já cadastrado!' });

                next(customError);
            } else {
                next();
            }

        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    }, errorCallback);
}

function update(req, res, next) {
    var id = req.params.id;

    var whereInner = { 
        storeId: id, 
        deletedAt: null 
    };

    accessLayer.orm.transaction(function(t) {
        return accessLayer.Store.update(req.body, { 
            transaction: t,  
            where: { 
                id: id, 
                deletedAt: null 
            }
        }).then(function() {
            return accessLayer.StoreAddress.update(req.body.address, { transaction: t, where: whereInner }).then(function() {
                return accessLayer.StoreParameters.update(req.body.parameters, { transaction: t, where: whereInner });
            });
        });
    }).then(function(result) {
        res.end();
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });
        
        next(customError);
    });
}

function getAll(req, res, next) {

    var findObj = {
        include: [
            { model: accessLayer.StoreAddress, require: false, as: 'address' },
            { model: accessLayer.StoreParameters, require: false, as: 'parameters' }
        ],
        attributes: ['name','nickname','phone','email','cnpj','sponsor','sponsorDocument','website','description','status','resume','open'],
        order: [['name','asc']]
    };

    if(req.params.latitude && req.params.longitude 
        && req.params.latitude.length > 0 && req.params.longitude.length > 0) {
        
        findObj.attributes.push([accessLayer.orm.literal(' (6371 * acos ( '
                + 'cos( radians(' + req.params.latitude + ') ) '
                + '* cos( radians( address.latitude ) ) '
                + '* cos( radians( address.longitude ) - radians(' + req.params.longitude + ') )' 
                + '+ sin( radians(' + req.params.latitude + ') )' 
                + '* sin( radians( address.latitude )))) ' ), 'distance'
        ]);
    }

    if(req.ids && req.ids.length > 0) {

        findObj.where = { id: { $in: req.ids } };
    }
    
    accessLayer.Store.findAll( findObj ).then(function(results) {
        res.json(results);
    }, function(error) {
        errorCallback(error, next);
    });
}

function getById(req, res, next) {
    var id = req.params.id;
    
    accessLayer.Store.findById(id, {
        include: [
            { model: accessLayer.StoreAddress, require: false, as: 'address' },
            { model: accessLayer.StoreParameters, require: false, as: 'parameters' }
        ]
    }).then(function(result) {
        if (result) {
            res.json(result);
            next();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, function(error) {
        errorCallback(error, next);
    });
}

function getByUser(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var id = req.params.id;
    
    accessLayer.StoresUsers.findAll({ 
        attributes: ['storeId'],
        where: { userId: id },
        order: [ ['default', 'ASC'] ]
    }).then(function(storesUsers) {
        var ids = [];

        for (var i = 0; i < storesUsers.length; i++) {
            ids.push(storesUsers[i].dataValues.storeId);
        }
        
        accessLayer.Store.findAll({
            include: [
                { model: accessLayer.StoreAddress, require: false, as: 'address' },
                { model: accessLayer.StoreParameters, require: false, as: 'parameters' }
            ],
            where: { 
                id: {
                    $in: ids
                }
            }
        }).then(function(results) {
            var stores = [];

            for (var i = 0; i < results.length; i++) {
                stores.push(results[i].dataValues);
            }

            if (stores.length > 0) {
                var cache = global.CacheManager.get(authHeader.token);
                cache.stores = stores;

                global.CacheManager.set(authHeader.token, cache);

                res.json(stores);
            } else {
                var error = new framework.models.SwtError({ httpCode: 403, message: 'Você não tem permissão para acessar esta aplicação :(' });

                next(error);
            }
        }, function(error) {
            errorCallback(error, next);
        });
    }, function(error) {
        errorCallback(error, next);
    });
}

function updateOpen(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);

    accessLayer.Store.findById(cache.stores[0].id).then(function(store) {
        if (store) {
            
            store.updateAttributes({ open: req.body.open }).then(function(result) {

                cache.stores[0].open = req.body.open;
                res.json({ updated: result.open });

            }, function(error) {
                errorCallback(error, next);
            });

        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, function(error) {
        errorCallback(error, next);
    });
}

function changeSession(req, res, next) {
    
}

function getByProduct(req, res, next) {

    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var id = req.params.id;
    
    accessLayer.ProductsStores.findAll({ 
        attributes: ['storeId'],
        where: { productId: id }
    }).then(function(storesProducts) {
        req.ids = [];

        for (var i = 0; i < storesProducts.length; i++) {
            req.ids.push(storesProducts[i].dataValues.storeId);
        }

        next();

    }, function(error) {
        errorCallback(error, next);
    });
}