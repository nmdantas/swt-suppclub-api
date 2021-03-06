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
        byDataStore: getByDataStore,
        count: getCountByStore
    },
    create:[
        preValidation,
        create
    ],
    update: [
        preValidation,
        registerRequestUpdate,
        updateStoreData,
        updateBasicData
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
    ],
    findByImage: [
        getPhash,
        findByImage
    ],
    approval:{
        all: getAllApproval,
        update: approveReject,
        get: getApprovalById,
        count: approvalCountByStore
    },
    user: {
        objective: {
            list: getByUserObjective
        },
        desire: {
            list: getByUserDesire,
            create: [
                preValidationUserDesire,
                createUserDesire
            ],
            delete: destroyUserDesire
        },
        rate: [
            preValidationUserDesire,
            addRate
        ],
        comment: [
            preValidationUserDesire,
            addComment
        ]
    }
};

function handleResponse(results, req) {
    var products = [];

    for (var i = 0; i < results.length; i++) {
        
        products.push(handleSingleResponse(results[i].dataValues,req));
    }

    return products;
}

function handleSingleResponse(product, req) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var isAdmin = (cache.roles.indexOf('Admin') > -1 || cache.roles.indexOf('Lojista_Admin') > -1);
    var index = -1;
    var belongsTo = 0;

    for (var j = 0; j < product.Stores.length; j++) {
        var match = product.Stores[j].id === cache.stores[0].id;

        if (match) {
            index = j;
        }

        belongsTo |= match;
    }

    // Volta a variavel para o tipo boolean, pois quando
    // o operador "|=" é usado o retorno é um inteiro
    product.belongsToStore = belongsTo ? true : false;
    product.storeIndex = index;

    if(!isAdmin && product.changes.length > 0) {
        var changes = [];
        for (var j = 0; j < product.changes.length; j++) {
            if(product.changes[j].storeRequest[0].id == cache.stores[0].id) {
                changes.push(product.changes[j]);
            }
        }
        product.changes = changes;
    }

    index = -1;
    belongsTo = 0;
    for (var i = 0; i < product.users.length; i++) {
        var match = product.users[i].userId === cache.user.id;

        if (match) {
            index = i;
        }

        belongsTo |= match;
    }

    // Volta a variavel para o tipo boolean, pois quando
    // o operador "|=" é usado o retorno é um inteiro
    product.belongsToUser = belongsTo ? true : false;
    product.userIndex = index;

    return product;
}

function getOrderBy(body) {
    var order = [];
    body.order = body.order || [];

    for (var i = 0; i < body.order.length; i++) {
        var index = body.order[i].column;
        var direction = body.order[i].dir
        var columnName = body.columns[index].data;
        
        order.push([columnName, direction]);
    }

    if (order.length == 0) {
        order.push(['name','asc']);
    }

    return order;
}

function formatQuery(query) {
    if (!query) {
        return query;
    }

    for (var property in query) {
        if (typeof query[property] === 'object' && query[property].$like) {
            query[property].$like = '%' + query[property].$like + '%';
        }
    }

    return query;
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

function findAndCountAllProduct(query,offset,limit,order,storeId) {

    var include = [ 
        { model: accessLayer.Brand, require: true }, 
        { model: accessLayer.Category, require: true }, 
        { model: accessLayer.Tag, require: false },
        { model: accessLayer.Objective, require: false },
        { model: accessLayer.ProductImage, as: 'images'},
        { model: accessLayer.ProductsUsers, require: false, as: 'users', attributes: ['userId','comment'] },
        { 
            attributes: ['id','status'],
            model: accessLayer.ProductChange, 
            require: false,
            as: 'changes',
            include: [
                { model: accessLayer.Store, as: 'storeRequest', require: true}
            ]
        }
    ];

    // produtos de uma loja
    if(storeId && storeId > 0) {
        include.push({ 
            model: accessLayer.Store, 
            require: false,
            through: { where: { storeId: storeId } }
        });
    } else {
        include.push({ model: accessLayer.Store, require: false });
    }

    return accessLayer.Product.findAndCountAll({
        include: include,
        where: formatQuery(query),
        offset: offset,
        limit: limit,
        order: order
    });
}

function create(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var isAdmin = (cache.roles.indexOf('Admin') > -1 || cache.roles.indexOf('Lojista_Admin') > -1);
    var responseBody = {};

    // Se não for Admin, cadastra o produto como pendente de aprovação
    req.body.status = isAdmin ? 1 : 3;

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

                    // Registra a pendencia de aprovação
                    if (req.body.status == 3) {
                        var productChange = {
                            original: null,
                            change: JSON.stringify(product),
                            changedBasicData: true,
                            userIdRequest: cache.user.id,
                            dateRequest: new Date(),
                            productId: product.id,
                            status: 4,
                            userIdApproval: null,
                            dateApproval: null
                        };

                        return createProductChange(productChange, cache.stores[0].id, t);
                    }
                });
            });
        });
    }).then(function(result) {
        res.json(responseBody);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, errorCode: 'SWT', message: error.message });

        next(customError);
    });
}

function registerRequestUpdate(req, res, next) {
    var id = req.params.id;
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var isAdmin = (cache.roles.indexOf('Admin') > -1 || cache.roles.indexOf('Lojista_Admin') > -1);

    findProductByID(id, cache.stores[0].id).then(function(result) {
        if (result) {
            
            var original = handleSingleResponse(result.dataValues,req);
            req.body.changedBasic = changedBasicData(original,req.body);
            req.body.changedStore = changedStoreData(original,req.body);
            var approvaded = isAdmin || !req.body.changedBasic;

            if (!req.body.changedBasic && !req.body.changedStore) {
                var customError = new framework.models.SwtError({ httpCode: 404, errorCode: 'SWT', message: 'Não foi encontrato alteração nos dados do produto' });
            }

            var productChange = {
                original: JSON.stringify(original),
                change: JSON.stringify(req.body),
                changedBasicData: req.body.changedBasic,
                userIdRequest: cache.user.id,
                dateRequest: new Date(),
                productId: req.body.id,
                status: approvaded ? 2 : 1,
                userIdApproval: approvaded ? cache.user.id : null,
                dateApproval: approvaded ? new Date() : null
            };

            req.body.changeStatus = productChange.status;

            accessLayer.orm.transaction(function(t) {
                return createProductChange(productChange, cache.stores[0].id, t);
            }).then(function(result) {
                next();
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

function createProductChange(productChange,storeId,t) {
    return accessLayer.ProductChange.create(productChange, { transaction: t }).then(function(change) {  

        return accessLayer.ProductsChangesStoresRequest.bulkCreate([{
            storeId: storeId,
            productChangeId: change.dataValues.id

        }], { transaction: t }).then(function(changeRequest) {
            if(productChange.status == 2) {

                return accessLayer.ProductsChangesStoresApproval.bulkCreate([{
                    storeId: storeId,
                    productChangeId: change.dataValues.id
                }], { transaction: t });
            }
        }); 
    });
}

function updateBasicData(req, res, next) {
    var id = req.params.id;
    var productUpToDate = {};

    if (req.body.changedBasic && req.body.changeStatus == 2) {

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
                        
                        return product.setObjectives(req.body.objectives, { transaction: t }).then(function(objectives) {
                        
                        productUpToDate = product;                    
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
    } else {
        res.json(req.body);   
    }
}

function updateStoreData(req, res, next) {
    var id = req.params.id;
    var storeId = getStoreId(req);
    var productUpToDate = {};

    if (req.body.changedStore) {

        accessLayer.orm.transaction(function(t) {
            return accessLayer.ProductsStores.destroy({ where: { storeId: storeId, productId: id }}).then(function() {
                    
                return accessLayer.ProductsStores.bulkCreate([{
                    storeId: storeId,
                    productId: id,
                    reference: req.body.reference,
                    stock: req.body.stock || 0,
                    price: req.body.price || 0.0
                }], { transaction: t });
            });
        }).then(function(result) {
            next();
        }, function(error) {
            var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });
            
            next(customError);
        });
    } else {
        next();
    }
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
    var id = req.params.id;
    var storeId = getStoreId(req);

    accessLayer.ProductsStores.destroy({ 
        where: { 
            productId: id,
            storeId: storeId
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
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = getOrderBy(req.body);
    var storeId = getStoreId(req);
    
    findAndCountAllProduct(req.query, offset, limit, order, storeId).then(function(result) {        
        var products = handleResponse(result.rows, req);

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
    var id = req.params.id;
    var storeId = getStoreId(req);

    findProductByID(id, storeId).then(function(result) {
        if (result) {
            var product = handleSingleResponse(result.dataValues, req);
            res.json(product);
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, function(error) {
        errorCallback(error, next);
    });
}

function getCountByStore(req, res, next) {
    var storeId = getStoreId(req);

    accessLayer.ProductsStores.count({
        where: {
            storeId: storeId
        }
    }).then(function(result) {
        res.json(result);
    }, function(error) {
        errorCallback(error, next);
    });
}

function findProductByID(id, storeId) {
    return accessLayer.Product.findById(id, { 
        include: [ 
            accessLayer.Brand, 
            accessLayer.Category, 
            accessLayer.Tag, 
            accessLayer.Objective,
            { model: accessLayer.ProductImage, as: 'images'},
            { model: accessLayer.ProductsUsers, require: false, as: 'users', attributes: ['userId','comment'] },
            { 
                model: accessLayer.Store, 
                require: false,
                through: { where: { storeId: storeId } }
            },
            { 
                model: accessLayer.ProductChange, 
                as: 'changes', 
                include: [ 
                    { model: accessLayer.Store, as: 'storeRequest'},
                    { model: accessLayer.Store, as: 'storeApproval'}
                ]
            }
        ]
    });
}

function getByDataStore(req, res, next) {
    var code = req.params.code;
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = getOrderBy(req.body);
    var storeId = getStoreId(req);

    var where = { storeId: storeId };
    if(code && code != "undefined") {
        where.reference = { $like: '%' + code + '%' };
    }

    accessLayer.ProductsStores.findAll({ 
        attributes: ['productId'],
        where: where
    }).then(function(productsStores) {
        var ids = [];
        var query = req.query || {};

        for (var i = 0; i < productsStores.length; i++) {
            ids.push(productsStores[i].dataValues.productId);
        }
        
        // adiciona os ids relacionados à referencia no where junto com os demais filtros
        query.id = {
            $in: ids
        };
        
        findAndCountAllProduct(query, offset, limit, order, storeId).then(function(result) {
            
            var returnedData = {
                draw: draw,
                recordsTotal: result.count,
                recordsFiltered: result.count,
                data: handleResponse(result.rows, req)
            }

            res.json(returnedData);
        }, function(error) {
            errorCallback(error, next);
        });
    }, function(error) {
        errorCallback(error, next);
    });
}

function getByUserObjective(req, res, next) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);

    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = getOrderBy(req.body);

    var query = "(SELECT p.* FROM Products as p " +
                "LEFT OUTER JOIN ProductsObjectives po ON p.id = po.productId " +
                "LEFT OUTER JOIN ObjectivesUsers ou ON po.objectiveId = ou.objectiveId " +
                "LEFT OUTER JOIN Objectives o on po.objectiveId = o.id " + 
                "WHERE ou.userId = " + cache.user.id + " AND o.id <> 5 __AND_CATEGORY__) " + 
                "UNION " + 
                "(SELECT p.* FROM Products p " + 
                "LEFT OUTER JOIN ProductsObjectives po ON p.id = po.productId " + 
                "LEFT OUTER JOIN Objectives o on po.objectiveId = o.id " + 
                "WHERE o.id = 5 __AND_CATEGORY__)";

    if(req.body.categoryId) {
        query = query.replace(/__AND_CATEGORY__/g, "AND p.categoryId = " + req.body.categoryId);
    } else {
        query = query.replace(/__AND_CATEGORY__/g, "");
    }
    
    accessLayer.orm.query(query, { model: accessLayer.Product }).then(function(productsImages) {
        
        var ids = [];
        var query = {};

        for (var i = 0; i < productsImages.length; i++) {
            ids.push(productsImages[i].dataValues.id);
        }
        
        // adiciona os ids relacionados à referencia no where junto com os demais filtros
        query.id = {
            $in: ids
        };
        
        findAndCountAllProduct(query, offset, limit, order).then(function(result) {
            var products = handleResponse(result.rows, req);

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
        productId: req.body.productId,
        imageType: req.body.imageType
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

//var imghash = require('imghash');

function getPhash(req, res, next) {

    framework.media.image.pHash(req.body.image, function(result) {
        console.log('** pHash: ' + result);
        
        if (result) {
            req.pHash = result;
            next();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    });

    /*var buf = Buffer.from(req.body.image, 'base64');

    imghash.hash(buf).then((hash) => {
        console.log('** pHash: ' + hash);
        
        if (hash) {
            req.pHash = hash;
            next();
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }
    });*/
}

function findByImage(req, res, next) {
    var offset = 0;
    var limit = 10;
    var draw = 0;
    var storeId = getStoreId(req);
    var order = [];
    order.push(['name','asc']);

    var query = "SELECT p.* " +  
                "FROM products as p " +
                "INNER JOIN productimages as pf on p.id = pf.productId " +
                "WHERE (1 - (BIT_COUNT( CAST(CONV(pf.phash, 16, 10) AS UNSIGNED) ^ CAST(CONV('" + req.pHash + "', 16, 10) AS UNSIGNED) ) / 64.0)) > 0.7 " +
                "AND pf.deletedAt IS NULL";

    accessLayer.orm.query(query, { model: accessLayer.Product }).then(function(productsImages) {
        
        var ids = [];
        var query = {};

        for (var i = 0; i < productsImages.length; i++) {
            ids.push(productsImages[i].dataValues.id);
        }
        
        // adiciona os ids relacionados à referencia no where junto com os demais filtros
        query.id = {
            $in: ids
        };
        
        findAndCountAllProduct(query, offset, limit, order, storeId).then(function(result) {
            var products = handleResponse(result.rows, req);

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

function changedBasicData(original, updated) {
    
    var isEquals = (original.name             == updated.name             &&
                    original.description      == updated.description      &&
                    original.contraindication == updated.contraindication &&
                    original.status           == updated.status           &&
                    original.ean              == updated.ean              &&
                    original.brandId          == updated.brandId          &&
                    original.categoryId       == updated.categoryId       &&
                    original.Tags.length      == updated.tags.length      &&
                    original.Objectives.length      == updated.objectives.length);

    if (isEquals && original.Tags.length > 0 && updated.tags.length > 0) {
        for (var i = 0; i < original.Tags.length; i++) {
            if (updated.tags.indexOf(original.Tags[i].id) == -1 ) {
                isEquals = false;
            }
        }
    }

    return !isEquals;
}

function changedStoreData(original, updated) {
    
    var isEquals = (original.Stores && 
                    original.Stores.length > 0 &&
                    original.Stores[0].ProductsStores.dataValues.reference == updated.reference &&
                    original.Stores[0].ProductsStores.dataValues.price     == updated.price);

    return !isEquals;
}

function getAllApproval(req, res, next) {
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = getOrderBy(req.body);

    var where = formatQuery(req.query);
    //where.changedBasicData = { $equal: 1 };
    where.$or = [
        { status: 1 },
        { status: 4 }
    ];
    
    accessLayer.ProductChange.findAndCountAll({ 
        include: [ 
            { 
                model: accessLayer.Product, 
                require: true,
                include: [ 
                    accessLayer.Brand, 
                    accessLayer.Category, 
                    accessLayer.Tag, 
                    accessLayer.Nutrient
                ]
            },
            { model: accessLayer.Store, as: 'storeRequest', require: true}
        ],
        where: where,
        offset: offset,
        limit: limit,
        order: order
    }).then(function(result) {
 
        var changes = [];
        for (var i = 0; i < result.rows.length; i++) {
            changes.push(handleResponseApproval(result.rows[i].dataValues));
        }

        var returnedData = {
            draw: draw,
            recordsTotal: result.count,
            recordsFiltered: result.count,
            data: changes
        }

        res.json(returnedData);
    }, function(error) {
        errorCallback(error, next);
    });
}

function getApprovalById(req, res, next) {
    var id = req.params.id;

    accessLayer.ProductChange.findById(id, {
        include: [ 
            { 
                model: accessLayer.Product, 
                require: true,
                include: [ 
                    accessLayer.Brand, 
                    accessLayer.Category, 
                    accessLayer.Tag, 
                    accessLayer.Nutrient
                ]
            },
            { model: accessLayer.Store, as: 'storeRequest', require: true}
        ]
    }).then(function(result) {
        if (result) {
            var change = handleResponseApproval(result);
            res.json(change);
        } else {
            var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

            next(customError);
        }            
    }, function(error) {
        errorCallback(error, next);
    });
}

function handleResponseApproval(results) {
    var statusString = ["","Pendente","Aprovado","Reprovado","Novo Produto"];

    results.statusStr = statusString[results.status]; 

    if(results.status == 1) {
        results.originalObj = results.Product;
    } else {
        results.originalObj = JSON.parse(results.original);
    }

    if(results.status == 4) {
        results.changeObj = results.Product;
    } else {
        results.changeObj = JSON.parse(results.change);
    }

    return results;
}

function approveReject(req, res, next) {
    var id = req.params.id;
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var applayChanges = req.body.action == 1;
    var productUpToDate;

    accessLayer.orm.transaction(function(t) {
        return accessLayer.ProductChange.findById(id, { 
            transaction: t,
            include: [ 
                { model: accessLayer.Product, require: true },
                { model: accessLayer.Store, as: 'storeRequest', require: true}
            ]
        }).then(function(productChange) {
            if (productChange) {
                
                productChange.status = applayChanges ? 2 : 3;
                productChange.dateApproval = new Date();
                productChange.userIdApproval = cache.user.id;
                productChange.storeId = cache.stores[0].id;
                productChange.reasonReject = req.body.reason;

                if(applayChanges) {
                    var product = JSON.parse(productChange.change);

                    return accessLayer.Product.update(product, { 
                        transaction: t,  
                        where: { 
                            id: product.id, 
                            deletedAt: null 
                        }
                    }).then(function() {
                        return accessLayer.Product.findById(id, { transaction: t }).then(function(result) {
                            productUpToDate = result;                    
                            product.tags = product.tags || [];
                            return result.setTags(product.tags, { transaction: t }).then(function(tags) {

                                return registerApprovalRequest(productChange, t);    
                            });
                        });
                    });
                } else {
                    return registerApprovalRequest(productChange, t);
                }
            } else {
                var customError = new framework.models.SwtError({ httpCode: 404, message: 'Registro não encontrado' });

                next(customError);
            }            
        });
    }).then(function(result) {
        res.json(productUpToDate);
    }, function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });
        
        next(customError);
    });
}

function registerApprovalRequest(productChange, t) {
    return productChange.save().then(function(result) {
        return accessLayer.ProductsChangesStoresApproval.bulkCreate([{
            storeId: productChange.storeId,
            productChangeId: productChange.id
        }], { transaction: t });
    });
}

function approvalCountByStore(req, res, next) {
    accessLayer.ProductChange.count({
        where: {
            $or: [{status: 1}, {status: 4}]
        }
    }).then(function(result) {
        res.json(result);
    }, function(error) {
        errorCallback(error, next);
    });
}

function getByUserDesire(req, res, next) {
    var offset = req.body.start || 0;
    var limit = req.body.length || 10;
    var draw = req.body.draw || 0;
    var order = getOrderBy(req.body);

    accessLayer.ProductsUsers.findAll({ 
        attributes: ['productId'],
        where: { 
            userId: getUserId(req)
        }
    }).then(function(productsUsers) {
        var ids = [];
        var query = req.query || {};

        for (var i = 0; i < productsUsers.length; i++) {
            ids.push(productsUsers[i].dataValues.productId);
        }
        
        // adiciona os ids relacionados à referencia no where junto com os demais filtros
        query.id = {
            $in: ids
        };
        
        findAndCountAllProduct(query, offset, limit, order).then(function(result) {
            
            var returnedData = {
                draw: draw,
                recordsTotal: result.count,
                recordsFiltered: result.count,
                data: handleResponse(result.rows, req)
            }

            res.json(returnedData);
        }, function(error) {
            errorCallback(error, next);
        });
    }, function(error) {
        errorCallback(error, next);
    });
}

function preValidationUserDesire(req, res, next) {
    var constraints = framework.common.validation.requiredFor('productId');
    var validationErrors = framework.common.validation.validate(req.body, constraints);

    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    if (!validationErrors) {

        req.body.userId = getUserId(req);

        accessLayer.ProductsUsers.findAll({ 
            where: {
                userId: req.body.userId,
                productId: req.body.productId
            }
        }).then(function(result) {
            if (result) {
                req.result = result;
                next();
            } else {
                errorCallback({ message: 'Registro não encontrato.'});
            }
        }, errorCallback);
    } else {
        errorCallback(validationErrors);
    }
}

function createUserDesire(req, res, next) {
    
    var errorCallback = function(error) {
        var customError = new framework.models.SwtError({ httpCode: 400, message: error.message });

        next(customError);
    };

    if (req.result && req.result.length > 0) {
        errorCallback({ message: 'Produto já cadastrado!'});
    } else {
        
        accessLayer.ProductsUsers.create( req.body ).then(function(result) {
            res.json(result);
        }, errorCallback );
    }
}

function destroyUserDesire(req, res, next) {
    var productId = req.params.id;

    accessLayer.ProductsUsers.destroy({ 
        where: { 
            userId: getUserId(req),
            productId: productId
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

function addRate(req, res, next) {
    
    if (req.result && req.result.length > 0) {
        
        var productUser = req.result[0];
        productUser.rate = req.body.rate;

        accessLayer.ProductsUsers.update(productUser, { 
            where: { 
                userId: req.body.userId,
                productId: req.body.productId,
                deletedAt: null 
            }
        }).then(function(result) {
            res.json(result);
        }, errorCallback );

    } else {
        errorCallback({ message: 'Produto não cadastrado!'});
    }
}

function addComment(req, res, next) {
    
    if (req.result && req.result.length > 0) {
        
        var productUser = req.result[0];
        productUser.comment = req.body.comment;

        accessLayer.ProductsUsers.update(productUser, { 
            where: { 
                userId: req.body.userId,
                productId: req.body.productId,
                deletedAt: null 
            }
        }).then(function(result) {
            res.json(result);
        }, errorCallback );

    } else {
        errorCallback({ message: 'Produto não cadastrado!'});
    }
}

function getStoreId(req) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    var storeId = 0;

    if(cache.stores && cache.stores.length > 0) {
        storeId = cache.stores[0].id;
    }

    return storeId;
}

function getUserId(req) {
    var authHeader = framework.common.parseAuthHeader(req.headers.authorization);
    var cache = global.CacheManager.get(authHeader.token);
    
    return cache.user.id;
}