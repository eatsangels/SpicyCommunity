import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
 
const withNextIntl = createNextIntlPlugin();
 
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'xrmvmcuwzzvmlqjhpvwa.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
 
export default withNextIntl(nextConfig);
