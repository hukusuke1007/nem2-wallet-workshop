const Dotenv = require('dotenv-webpack')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/nem2-wallet-workshop-answer/'
    : '/',
  outputDir: 'docs',
  configureWebpack: {
    plugins: [new Dotenv()]
  },
}