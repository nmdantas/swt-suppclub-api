/*
 * Stores x Users Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-06-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('StoresUsers', {
        storeId: { type: DataType.INTEGER, allowNull: false, primaryKey: true },
        userId: { type: DataType.INTEGER, allowNull: false, primaryKey: true },
        default: { type: DataType.BOOLEAN, allowNull: false, defaultValue: false }
    }, {
        underscored: false,
        freezeTableName: true
    });
}