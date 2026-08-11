<<<<<<< HEAD
require('dotenv/config');
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydatabase?schema=public',
  },
});
=======
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: './prisma/schema.prisma',
    datasource: {
        url: (0, config_1.env)('DATABASE_URL'),
    },
});
//# sourceMappingURL=prisma.config.js.map
>>>>>>> e52a24ea29f3dbed57cfdb5f60aa5e20f9d2173b
