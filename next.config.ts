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
        source: "/:path((?!docs/).*)", // Matches any path not starting with /docs/
        destination: "/docs/:path*",
        has: [
          {
            type: "host",
            value: "docs.jino.lmcgroup.xyz",
          },
        ],
      },
      // Rule for docs.localhost
      {
        source: "/:path((?!docs/).*)", // Matches any path not starting with /docs/
        destination: "/docs/:path*",
        has: [
          {
            type: "host",
            value: "docs.localhost",
          },
        ],
      },
      // Rule for build.jino.lmcgroup.xyz
      {
        source: "/:path((?!build/).*)", // Matches any path not starting with /build/
        destination: "/build/:path*",
        has: [
          {
            type: "host",
            value: "build.jino.lmcgroup.xyz",
          },
        ],
      },
      // Rule for build.localhost
      {
        source: "/:path((?!build/).*)", // Matches any path not starting with /build/
        destination: "/build/:path*",
        has: [
          {
            type: "host",
            value: "build.localhost",
          },
        ],
      },
      // Rule for jino.lmcgroup.xyz
      {
        source: "/:path((?!site/).*)", // Matches any path not starting with /site/
        destination: "/site/:path*",
        has: [
          {
            type: "host",
            value: "jino.lmcgroup.xyz",
          },
        ],
      },
      // Rule for jino.localhost
      {
        source: "/:path((?!site/).*)", // Matches any path not starting with /site/
        destination: "/site/:path*",
        has: [
          {
            type: "host",
            value: "jino.localhost",
          },
        ],
      },
      // Rule for localhost
      {
        source: "/:path((?!site/).*)", // Matches any path not starting with /site/
        destination: "/site/:path*",
        has: [
          {
            type: "host",
            value: "localhost",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect local /docs to docs.localhost:3000
      {
        source: '/docs/:path*',
        has: [{ type: 'host', value: 'localhost' }],
        destination: 'http://docs.localhost:3000',
        permanent: false,
      },
      // Redirect any /docs or /docs/* to docs.jino.lmcgroup.xyz
      {
        source: '/docs/:path*',
        has: [{ type: 'host', value: 'jino.lmcgroup.xyz' }],
        destination: 'https://docs.jino.lmcgroup.xyz',
        permanent: false,
      },
      // Redirect local /build to build.localhost:3000
      {
        source: '/build/:path*',
        has: [{ type: 'host', value: 'localhost' }],
        destination: 'http://build.localhost:3000',
        permanent: false,
      },
      // Redirect any /build or /build/* to build.jino.lmcgroup.xyz
      {
        source: '/build/:path*',
        has: [{ type: 'host', value: 'jino.lmcgroup.xyz' }],
        destination: 'https://build.jino.lmcgroup.xyz',
        permanent: false,
      },
      // Redirect /site on any subdomain.localhost back to main localhost
      {
        source: '/site/:path*',
        has: [{ type: 'host', value: ':subdomain.localhost' }],
        destination: 'http://localhost:3000',
        permanent: false,
      },
      // Redirect /site on main localhost to site.localhost:3000
      {
        source: '/site/:path*',
        has: [{ type: 'host', value: 'localhost' }],
        destination: 'http://site.localhost:3000',
        permanent: false,
      },
      // Redirect any /site or /site/* to jino.lmcgroup.xyz
      {
        source: '/site/:path*',
        has: [{ type: 'host', value: 'jino.lmcgroup.xyz' }],
        destination: 'https://jino.lmcgroup.xyz',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
