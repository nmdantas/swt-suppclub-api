/*
 * Data access (Sequelize+MySql)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-12 | Nicholas M. Dantas
 */

'use strict';

/*
 * Module dependencies.
 */
var Sequelize = require('sequelize');
var options = {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    pool: {
        min: 0,
        max: process.env.DB_POOL_LIMIT
    },
    storage: process.env.DB_STORAGE,
    logging: false
};
// Timezone não é suportado no SQLite
if (process.env.DB_DIALECT !== 'sqlite') {
    options.timezone = 'America/Sao_Paulo'
}
var sequelize = new Sequelize(process.env.DB_BASE, process.env.DB_USER, process.env.DB_PASS, options);

// Models
var NutrientSchema = sequelize.import('./models/nutrient');
var BrandSchema = sequelize.import('./models/brand');
var StoreSchema = sequelize.import('./models/store');
var StoreAddressSchema = sequelize.import('./models/storeAddress');
var StoresUsersSchema = sequelize.import('./models/storesUsers');
var StoreParametersSchema = sequelize.import('./models/storeParameters');
var PostSchema = sequelize.import('./models/post');
var TagSchema = sequelize.import('./models/tag');
var ObjectiveSchema = sequelize.import('./models/objective');
var ObjectivesUsersSchema = sequelize.import('./models/objectivesUsers');
var CategorySchema = sequelize.import('./models/category');
var ProductSchema = sequelize.import('./models/product');
var ProductImageSchema = sequelize.import('./models/productImage');
var ProductChangeSchema = sequelize.import('./models/productChange');
var ProductsUsersSchema = sequelize.import('./models/productsUsers');

// Associação Objetivo x Tag
var ObjectivesTags = sequelize.define('ObjectivesTags', {}, { freezeTableName: true });
ObjectiveSchema.belongsToMany(TagSchema, { through: ObjectivesTags, foreignKey: 'objectiveId', otherKey: 'tagId' });
TagSchema.belongsToMany(ObjectiveSchema, { through: ObjectivesTags, foreignKey: 'tagId', otherKey: 'objectiveId' });

// Associação Objetivo x Usuário
ObjectivesUsersSchema.belongsTo(ObjectiveSchema, { foreignKey: 'objectiveId', as: 'objective' });
ObjectiveSchema.hasMany(ObjectivesUsersSchema, { foreignKey: 'objectiveId', as: 'users' });

// Associação de Hierarquida de categorias
CategorySchema.hasMany(CategorySchema, { foreignKey: 'categoryId', as: 'categories' });
CategorySchema.belongsTo(CategorySchema, { foreignKey: 'categoryId', as: 'parent' });

// Associações de Produto
var ProductsTags = sequelize.define('ProductsTags', {}, { freezeTableName: true });
var ProductsObjectives = sequelize.define('ProductsObjectives', {}, { freezeTableName: true });
var ProductsChangesStoresRequest = sequelize.define('ProductsChangesStoresRequest', {}, { freezeTableName: true });
var ProductsChangesStoresApproval = sequelize.define('ProductsChangesStoresApproval', {}, { freezeTableName: true });
var ProductsNutrients = sequelize.define('ProductsNutrients', {
    value: Sequelize.STRING,
    portion: Sequelize.STRING
}, { freezeTableName: true });

BrandSchema.hasMany( ProductSchema, { as: 'products', foreignKey: 'brandId'} );
ProductSchema.belongsTo(BrandSchema, { foreignKey: 'brandId' });

CategorySchema.hasMany( ProductSchema, { as: 'products', foreignKey: 'categoryId'} );
ProductSchema.belongsTo(CategorySchema, { foreignKey: 'categoryId' });

ProductSchema.belongsToMany(TagSchema, { through: ProductsTags, foreignKey: 'productId', otherKey: 'tagId' });
ProductSchema.belongsToMany(ObjectiveSchema, { through: ProductsObjectives, foreignKey: 'productId', otherKey: 'objectiveId' });
ProductSchema.belongsToMany(NutrientSchema, { through: ProductsNutrients, foreignKey: 'productId', otherKey: 'nutrientId' });

TagSchema.belongsToMany(ProductSchema, { through: ProductsTags, foreignKey: 'tagId', otherKey: 'productId' });
ObjectiveSchema.belongsToMany(ProductSchema, { through: ProductsObjectives, foreignKey: 'objectiveId', otherKey: 'productId' });
NutrientSchema.belongsToMany(ProductSchema, { through: ProductsNutrients, foreignKey: 'nutrientId', otherKey: 'productId' });

// Associações de Lojas x Produtos
var ProductsStores = sequelize.define('ProductsStores', {
    reference: Sequelize.STRING,
    stock: Sequelize.INTEGER,
    price: Sequelize.DECIMAL(10, 2)
}, { freezeTableName: true });

StoreSchema.belongsToMany(ProductSchema, { through: ProductsStores, foreignKey: 'storeId', otherKey: 'productId' });
ProductSchema.belongsToMany(StoreSchema, { through: ProductsStores, foreignKey: 'productId', otherKey: 'storeId' });

ProductSchema.hasMany( ProductImageSchema, { as: 'images', foreignKey: 'productId'} );
ProductImageSchema.belongsTo(ProductSchema, {foreignKey: 'productId'});

ProductSchema.hasMany( ProductChangeSchema, { as: 'changes', foreignKey: 'productId'} );
ProductChangeSchema.belongsTo(ProductSchema, {foreignKey: 'productId'});

ProductChangeSchema.belongsToMany(StoreSchema, { through: ProductsChangesStoresRequest, foreignKey: 'productChangeId', otherKey: 'storeId', as: 'storeRequest' });
StoreSchema.belongsToMany(ProductChangeSchema, { through: ProductsChangesStoresRequest, foreignKey: 'storeId', otherKey: 'productChangeId' });

ProductChangeSchema.belongsToMany(StoreSchema, { through: ProductsChangesStoresApproval, foreignKey: 'productChangeId', otherKey: 'storeId', as: 'storeApproval' });
StoreSchema.belongsToMany(ProductChangeSchema, { through: ProductsChangesStoresApproval, foreignKey: 'storeId', otherKey: 'productChangeId' });

// Associação Produto x Usuário
ProductsUsersSchema.belongsTo(ProductSchema, { foreignKey: 'productId', as: 'product' });
ProductSchema.hasMany(ProductsUsersSchema, { foreignKey: 'productId', as: 'users' });

StoreSchema.hasOne(StoreAddressSchema, { as: 'address', foreignKey: 'storeId'});
StoreSchema.hasOne(StoreParametersSchema, { as: 'parameters', foreignKey: 'storeId'});

// Cria (sobrescreve caso já exista) o banco de dados de acordo com os esquemas (Schema)
//sequelize.sync({
//   force: true
//});

module.exports = {
    orm: sequelize,
    Nutrient: NutrientSchema,
    Brand: BrandSchema,
    Store: StoreSchema,
    StoreAddress: StoreAddressSchema,
    StoresUsers: StoresUsersSchema,
    StoreParameters: StoreParametersSchema,
    Post: PostSchema,
    Tag: TagSchema,
    Objective: ObjectiveSchema,
    ObjectivesUsers: ObjectivesUsersSchema,
    Category: CategorySchema,
    Product: ProductSchema,
    ProductsStores: ProductsStores,
    ProductsNutrients: ProductsNutrients,
    ObjectivesTags: ObjectivesTags,
    ProductImage: ProductImageSchema,
    ProductChange: ProductChangeSchema,
    ProductsChangesStoresRequest: ProductsChangesStoresRequest,
    ProductsChangesStoresApproval: ProductsChangesStoresApproval,
    ProductsUsers: ProductsUsersSchema
};