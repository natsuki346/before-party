import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/e/test-event/members",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
