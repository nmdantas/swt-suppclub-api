/*
 * Store Schema (For Sequelize ORM)
 *
 * Copyright(c) 2017 Fabbrika
 * Author: 2017-04-15 | Nicholas M. Dantas
 */

'use strict';

module.exports = function(sequelize, DataType) {
    return sequelize.define('Store', {
        name: { type: DataType.STRING, allowNull: false },
        nickname: { type: DataType.STRING, allowNull: false },
        phone: { type: DataType.STRING, allowNull: true },
        email: { 
            type: DataType.STRING, 
            allowNull: false, 
            validate: { 
                isEmail: true 
            } 
        },
        cnpj: { type: DataType.STRING, allowNull: false },
        sponsor: { type: DataType.STRING, allowNull: false },
        sponsorDocument: { type: DataType.STRING, allowNull: false },
        website: { type: DataType.STRING, allowNull: true },
        description: { type: DataType.STRING, allowNull: true },
        status: { type: DataType.INTEGER, allowNull: false },
        resume: { type: DataType.STRING, allowNull: true },
        open: { type: DataType.BOOLEAN, allowNull: false },
    }, {
        paranoid: true,
        underscored: false
    });
}