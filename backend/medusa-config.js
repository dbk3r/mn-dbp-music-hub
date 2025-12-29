module.exports = {
  projectConfig: {
    redis_url: "redis://localhost:6379",
    database_type: "sqlite",
    database_url: "./medusa-db.sql",
    store_cors: process.env.MEDUSA_STORE_CORS || "http://localhost:3000",
    admin_cors: process.env.MEDUSA_ADMIN_CORS || "http://localhost:7000",
    http: {
      jwtSecret: "supergeheimes",
      cookieSecret: "supergeheimescookie"
    }
  },
  plugins: [
    {
      resolve: `medusa-file-local`,
      options: { },
    },
  ],
}