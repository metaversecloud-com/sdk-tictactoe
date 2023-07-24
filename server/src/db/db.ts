import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

dotenv.config();

let dbPort = Number(process.env.DB_PORT);

if (isNaN(dbPort))
  dbPort = 3306;

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  port: dbPort,
  dialect: "mysql", /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
});

export default sequelize;
