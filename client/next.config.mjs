const nextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    const backendBaseUrl =
      process.env.API_PROXY_TARGET ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:5000";

    return [
      {
        source: "/backend/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
