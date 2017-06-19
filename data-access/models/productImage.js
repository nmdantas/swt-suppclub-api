/*
 * Product Image Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('ProductImage', {
        public_id: { type: DataType.STRING, allowNull: false },
        phash: { type: DataType.STRING, allowNull: true },
        secure_url: { type: DataType.STRING, allowNull: true },
        url: { type: DataType.STRING, allowNull: false }
    }, {
        paranoid: true,
        underscored: false
    });
}