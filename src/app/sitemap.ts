import { MetadataRoute } from 'next';
import { TournamentService } from '@/lib/services/tournament-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://spicycommunity.com'; // Adjust to your actual domain

  // 1. Static Routes
  const staticRoutes = [
    '',
    '/tournaments',
    '/winners',
    '/auth/login',
    '/auth/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Tournament Routes
  const tournaments = await TournamentService.getAllTournaments();
  const tournamentRoutes = (tournaments || []).map((t) => ({
    url: `${baseUrl}/tournaments/${t.id}`,
    lastModified: new Date(t.updated_at || t.created_at || new Date()),
    changeFrequency: 'hourly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...tournamentRoutes];
}
