module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'webmerge_secret_key_change_in_production',
  PORT: parseInt(process.env.PORT, 10) || 8080,
};
