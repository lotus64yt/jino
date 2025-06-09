import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // API Rule (MOVED TO FIRST)
      {
        source: "/api/:path*",
        destination: "http://portal.host.lmcgroup.xyz:4010/:path*",
      },
      // Rule for docs.jino.lmcgroup.xyz
      {
        source: '/:path((?!docs/).*)', // Matches any path not starting with /docs/
        destination: '/docs/:path*',
        has: [
          {
            type: 'host',
            value: 'docs.jino.lmcgroup.xyz',
          }
        ],
      },
      // Rule for docs.localhost
      {
        source: '/:path((?!docs/).*)', // Matches any path not starting with /docs/
        destination: '/docs/:path*',
        has: [
          {
            type: 'host',
            value: 'docs.localhost',
          }
        ],
      },
      // Rule for build.jino.lmcgroup.xyz
      {
        source: '/:path((?!build/).*)', // Matches any path not starting with /build/
        destination: '/build/:path*',
        has: [
          {
            type: 'host',
            value: 'build.jino.lmcgroup.xyz',
          }
        ],
      },
      // Rule for build.localhost
      {
        source: '/:path((?!build/).*)', // Matches any path not starting with /build/
        destination: '/build/:path*',
        has: [
          {
            type: 'host',
            value: 'build.localhost',
          }
        ],
      },
      // Rule for jino.lmcgroup.xyz
      {
        source: '/:path((?!site/).*)', // Matches any path not starting with /site/
        destination: '/site/:path*',
        has: [
          {
            type: 'host',
            value: 'jino.lmcgroup.xyz',
          }
        ],
      },
      // Rule for jino.localhost
      {
        source: '/:path((?!site/).*)', // Matches any path not starting with /site/
        destination: '/site/:path*',
        has: [
          {
            type: 'host',
            value: 'jino.localhost',
          }
        ],
      },
      // Rule for localhost
      {
        source: '/:path((?!site/).*)', // Matches any path not starting with /site/
        destination: '/site/:path*',
        has: [
          {
            type: 'host',
            value: 'localhost',
          },
        ],
      },
    ];
  },
  /* other config options here */
};

export default nextConfig;
