import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // the desk was built at /desk before it became the home page
  async redirects() {
    return [
      { source: '/desk', destination: '/', permanent: false },
      { source: '/desk/credits', destination: '/credits', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Dynamically allow the hostname based on the Project ID env var
        hostname: `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
