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
var PostSchema = sequelize.import('./models/post');
var TagSchema = sequelize.import('./models/tag');
var ObjectiveSchema = sequelize.import('./models/objective');
var CategorySchema = sequelize.import('./models/category');
var ProductSchema = sequelize.import('./models/product');

// Associação Objetivo x Tag
var ObjectivesTags = sequelize.define('ObjectivesTags', {}, { freezeTableName: true });

ObjectiveSchema.belongsToMany(TagSchema, { through: ObjectivesTags })
TagSchema.belongsToMany(ObjectiveSchema, { through: ObjectivesTags });

// Associações de Produto
var ProductsTags = sequelize.define('ProductsTags', {}, { freezeTableName: true });
var ProductsNutrients = sequelize.define('ProductsNutrients', {
    value: Sequelize.STRING,
    portion: Sequelize.STRING
}, { freezeTableName: true });

ProductSchema.belongsTo(BrandSchema);
ProductSchema.belongsTo(CategorySchema);
ProductSchema.belongsToMany(TagSchema, { through: ProductsTags });
ProductSchema.belongsToMany(NutrientSchema, { through: ProductsNutrients });

TagSchema.belongsToMany(ProductSchema, { through: ProductsTags });
NutrientSchema.belongsToMany(ProductSchema, { through: ProductsNutrients });

// Associações de Lojas x Produtos
var StoresProducts = sequelize.define('StoresProducts', {
    reference: Sequelize.STRING,
    stock: Sequelize.INTEGER,
    price: Sequelize.DECIMAL(10, 2)
}, { freezeTableName: true });

StoreSchema.belongsToMany(ProductSchema, { through: StoresProducts });
ProductSchema.belongsToMany(StoreSchema, { through: StoresProducts });

// Cria/Atualiza o banco de dados de acordo com os esquemas (Schema)
// sequelize.sync({
//     force: true
// });

module.exports = {
    orm: sequelize,
    Nutrient: NutrientSchema,
    Brand: BrandSchema,
    Store: StoreSchema,
    Post: PostSchema,
    Tag: TagSchema,
    Objective: ObjectiveSchema,
    Category: CategorySchema,
    Product: ProductSchema
};