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
      // Redirect /docs
      {
        source: "/docs",
        destination: "http://docs.localhost:3000",
        has: [
          {
            type: "host",
            value: "localhost",
          },
        ],
        permanent: false,
      },
      {
        source: "/docs",
        destination: "https://docs.jino.lmcgroup.xyz",
        has: [
          {
            type: "host",
            value: "jino.lmcgroup.xyz",
          },
        ],
        permanent: false,
      },
      // Redirect /build
      {
        source: "/build",
        destination: "http://build.localhost:3000",
        has: [
          {
            type: "host",
            value: "localhost",
          },
        ],
        permanent: false,
      },
      {
        source: "/build",
        destination: "https://build.jino.lmcgroup.xyz",
        has: [
          {
            type: "host",
            value: "jino.lmcgroup.xyz",
          },
        ],
        permanent: false,
      },
      // Redirect /site
      {
        source: "/site",
        destination: "http://localhost:3000",
        has: [
          {
            type: "host",
            value: "localhost",
          },
        ],
        permanent: false,
      },
      {
        source: "/site",
        destination: "https://site.jino.lmcgroup.xyz",
        has: [
          {
            type: "host",
            value: "jino.lmcgroup.xyz",
          },
        ],
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
