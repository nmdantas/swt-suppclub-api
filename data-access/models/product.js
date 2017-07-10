/*
 * Product Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('Product', {
        name: { type: DataType.STRING, allowNull: false, unique: true },
        description: { type: DataType.STRING, allowNull: true },
        contraindication: { type: DataType.STRING, allowNull: true },
        status: { type: DataType.INTEGER, allowNull: false, default: 0 }, // 1 = Ativo; 2 = Inativo; 3 = Pendente
        ean: { type: DataType.STRING, allowNull: true }
    }, {
        paranoid: true,
        underscored: false
    });
}