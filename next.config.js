/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@components': __dirname + '/components',
      '@lib': __dirname + '/lib',
    };
    return config;
  },
};

module.exports = nextConfig;
