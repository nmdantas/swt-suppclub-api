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
        byUser: getByUser
    },
    update: {
        data: [
            preValidation,
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

        var id = req.params ? req.params.id : 0;
        var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
        var cache = global.CacheManager.get(authHeader.token);

        if(id) {
            accessLayer.StoresUsersSchema.findAll({
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
        } else {
            next();
        }

    }
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
    var identity = framework.common.parseAuthHeader(req.headers.authorization);
 
    accessLayer.Store.update(req.body, { where: { id: id, deletedAt: null } }).then(function(result) {
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

function getAll(req, res, next) {
    accessLayer.Store.findAll().then(function(results) {
        var stores = [];

        for (var i = 0; i < results.length; i++) {
            stores.push(results[i].dataValues);
        }

        res.json(stores);
    }, function(error) {
        errorCallback(error, next);
    });
}

function getById(req, res, next) {
    var id = req.params.id;
    
    accessLayer.Store.findById(id).then(function(result) {
        if (result) {
            res.json(result);
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