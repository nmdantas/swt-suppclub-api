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
    }
};

function errorCallback(error, next) {
    var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

    next(customError);
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