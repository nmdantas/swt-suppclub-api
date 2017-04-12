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

var sequelize = new Sequelize(process.env.DB_BASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    pool: {
        min: 0,
        max: process.env.DB_POOL_LIMIT
    }
});

var BrandSchema = sequelize.define('brands', {
    name: { type: Sequelize.STRING, allowNull: false }
}, {
    paranoid: true,
    underscored: false,
    freezeTableName: true
});

sequelize.sync();

module.exports = {
    Brand: BrandSchema
};