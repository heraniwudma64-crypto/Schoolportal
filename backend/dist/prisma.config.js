"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("prisma/config");
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL || "postgresql://postgres.jdwpgbubenazrdqohgrq:cBPxVXxEHYm2_8v@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    },
});
//# sourceMappingURL=prisma.config.js.map