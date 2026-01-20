"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const mongoose_1 = require("mongoose");
const tourModel_1 = __importDefault(require("../../src/models/tourModel"));
(0, dotenv_1.config)({
    path: './.env',
});
const DB = process.env.NODE_ENV === 'production'
    ? process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD ?? '')
    : process.env.DATABASE_LOCAL;
if (DB) {
    (0, mongoose_1.connect)(DB)
        .then(() => console.log('DB connection successful!'))
        .catch((err) => console.log('DB Error:', err));
}
const tours = JSON.parse((0, fs_1.readFileSync)(`${__dirname}/tours-simple.json`, 'utf-8'));
const importData = async function () {
    try {
        await tourModel_1.default.create(tours);
        console.log(`Tour Data imported successfully Total:${tours.length}`);
    }
    catch (error) {
        console.log('Import Error', error);
    }
    process.exit();
};
const deleteData = async function () {
    try {
        await tourModel_1.default.deleteMany();
        console.log('Tours deleted successfully');
    }
    catch (error) {
        console.log('Delete db error:', error);
    }
    process.exit();
};
if (process.argv[2] === '--import') {
    importData();
}
else if (process.argv[2] === '--delete') {
    deleteData();
}
else {
    console.log('No action specified. Specify between --import or --delete');
}
//# sourceMappingURL=import-dev-data.js.map