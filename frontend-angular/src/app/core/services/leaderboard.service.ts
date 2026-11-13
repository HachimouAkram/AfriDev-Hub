import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from './auth.service';

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  profileId: string;
  fullName: string;
  avatarUrl?: string;
  title: string;
  country: string;
  city: string;
  xpPoints: number;
  levelTitle: string;
  levelNumber: number;
  levelBadge: string;
  isCurrentUser: boolean;
  pointsToNextRank?: number;
}

export interface LeaderboardResponse {
  userRank?: number;
  totalDevelopers: number;
  isAuthenticated: boolean;
  targetDeveloper?: LeaderboardEntry;
  top5: LeaderboardEntry[];
  surroundingNeighborhood: LeaderboardEntry[];
  publicTop10: LeaderboardEntry[];
  fromCache?: boolean;
  cachedAt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/leaderboard';
  private readonly CACHE_STORAGE_KEY_PREFIX = 'afridev_leaderboard_cache_v2_';
  private memoryCache = new Map<string, { data: LeaderboardResponse; timestamp: number }>();

  /**
   * Récupère immédiatement le résultat enregistré en cache (mémoire ou sessionStorage)
   */
  getCached(query?: string): LeaderboardResponse | null {
    const key = this.getCacheKey(query);
    const mem = this.memoryCache.get(key);
    if (mem) {
      return { ...mem.data, fromCache: true };
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(this.CACHE_STORAGE_KEY_PREFIX + key);
        if (stored) {
          const parsed = JSON.parse(stored) as LeaderboardResponse;
          this.memoryCache.set(key, { data: parsed, timestamp: Date.now() });
          return { ...parsed, fromCache: true };
        }
      } catch (e) {
        // Ignore fallback
      }
    }
    return null;
  }

  /**
   * Sauvegarde les résultats renvoyés par le serveur / Redis dans le cache client
   */
  saveCache(query: string | undefined, data: LeaderboardResponse): void {
    const key = this.getCacheKey(query);
    this.memoryCache.set(key, { data, timestamp: Date.now() });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(this.CACHE_STORAGE_KEY_PREFIX + key, JSON.stringify(data));
      } catch (e) {
        // Ignore quota
      }
    }
  }

  private getCacheKey(query?: string): string {
    return query && query.trim() ? `search_${query.trim().toLowerCase()}` : 'default';
  }

  getLeaderboard(query?: string): Observable<ApiResponse<LeaderboardResponse>> {
    let params = new HttpParams();
    if (query && query.trim()) {
      params = params.set('q', query.trim());
    }
    return this.http.get<ApiResponse<LeaderboardResponse>>(this.apiUrl, { params });
  }

  getPublicLeaderboard(): Observable<ApiResponse<LeaderboardResponse>> {
    return this.http.get<ApiResponse<LeaderboardResponse>>(`${this.apiUrl}/public`);
  }

  getMyLeaderboard(): Observable<ApiResponse<LeaderboardResponse>> {
    return this.http.get<ApiResponse<LeaderboardResponse>>(`${this.apiUrl}/me`);
  }

  search(query: string): Observable<ApiResponse<LeaderboardResponse>> {
    const params = new HttpParams().set('q', query.trim());
    return this.http.get<ApiResponse<LeaderboardResponse>>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Retourne le code ISO 3166-1 alpha-2 du pays africain (ou null si non trouvé)
   */
  getCountryIsoCode(countryName?: string): string | null {
    if (!countryName) return null;
    const c = countryName.trim().toLowerCase();
    const map: { [key: string]: string } = {
      'senegal': 'sn', 'sénégal': 'sn',
      'ghana': 'gh',
      'algeria': 'dz', 'algérie': 'dz', 'algerie': 'dz',
      'cote d\'ivoire': 'ci', 'côte d\'ivoire': 'ci', 'ivory coast': 'ci', 'cote d’ivoire': 'ci', 'côte d’ivoire': 'ci',
      'nigeria': 'ng',
      'kenya': 'ke',
      'rwanda': 'rw',
      'cameroon': 'cm', 'cameroun': 'cm',
      'benin': 'bj', 'bénin': 'bj',
      'togo': 'tg',
      'mali': 'ml',
      'burkina faso': 'bf', 'burkina': 'bf',
      'guinea': 'gn', 'guinée': 'gn',
      'guinea-bissau': 'gw', 'guinée-bissau': 'gw',
      'niger': 'ne',
      'gabon': 'ga',
      'congo': 'cg',
      'rdc': 'cd', 'democratic republic of the congo': 'cd', 'congo-kinshasa': 'cd', 'drc': 'cd', 'république démocratique du congo': 'cd',
      'morocco': 'ma', 'maroc': 'ma',
      'tunisia': 'tn', 'tunisie': 'tn',
      'egypt': 'eg', 'égypte': 'eg',
      'south africa': 'za', 'afrique du sud': 'za', 'rsa': 'za',
      'madagascar': 'mg',
      'tanzania': 'tz', 'tanzanie': 'tz',
      'uganda': 'ug', 'ouganda': 'ug',
      'ethiopia': 'et', 'éthiopie': 'et',
      'mauritius': 'mu', 'maurice': 'mu',
      'angola': 'ao',
      'mozambique': 'mz',
      'zambia': 'zm', 'zambie': 'zm',
      'zimbabwe': 'zw',
      'namibia': 'na', 'namibie': 'na',
      'botswana': 'bw',
      'sudan': 'sd', 'soudan': 'sd',
      'south sudan': 'ss', 'soudan du sud': 'ss',
      'chad': 'td', 'tchad': 'td',
      'somalia': 'so', 'somalie': 'so',
      'djibouti': 'dj',
      'comoros': 'km', 'comores': 'km',
      'cape verde': 'cv', 'cap-vert': 'cv',
      'seychelles': 'sc',
      'mauritania': 'mr', 'mauritanie': 'mr',
      'liberia': 'lr', 'libéria': 'lr',
      'sierra leone': 'sl',
      'gambia': 'gm', 'gambie': 'gm',
      'equatorial guinea': 'gq', 'guinée équatoriale': 'gq',
      'central african republic': 'cf', 'centrafrique': 'cf',
      'burundi': 'bi',
      'eswatini': 'sz', 'swaziland': 'sz',
      'lesotho': 'ls',
      'eritrea': 'er', 'érythrée': 'er',
      'libya': 'ly', 'libye': 'ly'
    };

    if (map[c]) return map[c];
    if (c.length === 2 && /^[a-z]{2}$/.test(c)) return c;
    return null;
  }

  /**
   * Retourne l'URL de l'image officielle haute résolution du drapeau national
   */
  getCountryFlagUrl(countryName?: string): string | null {
    const code = this.getCountryIsoCode(countryName);
    return code ? `https://flagcdn.com/w40/${code}.png` : null;
  }

  /**
   * Retourne l'emoji drapeau officiel du pays africain (ou 🌍 par défaut)
   */
  getCountryFlag(countryName?: string): string {
    if (!countryName) return '🌍';
    const c = countryName.trim().toLowerCase();
    const map: { [key: string]: string } = {
      'senegal': '🇸🇳', 'sénégal': '🇸🇳',
      'cote d\'ivoire': '🇨🇮', 'côte d\'ivoire': '🇨🇮', 'ivory coast': '🇨🇮',
      'benin': '🇧🇯', 'bénin': '🇧🇯',
      'togo': '🇹🇬',
      'cameroon': '🇨🇲', 'cameroun': '🇨🇲',
      'nigeria': '🇳🇬',
      'ghana': '🇬🇭',
      'kenya': '🇰🇪',
      'rwanda': '🇷🇼',
      'mali': '🇲🇱',
      'burkina faso': '🇧🇫', 'burkina': '🇧🇫',
      'guinea': '🇬🇳', 'guinée': '🇬🇳',
      'niger': '🇳🇪',
      'gabon': '🇬🇦',
      'congo': '🇨🇬', 'rdc': '🇨🇩', 'democratic republic of the congo': '🇨🇩',
      'morocco': '🇲🇦', 'maroc': '🇲🇦',
      'algeria': '🇩🇿', 'algérie': '🇩🇿',
      'tunisia': '🇹🇳', 'tunisie': '🇹🇳',
      'egypt': '🇪🇬', 'égypte': '🇪🇬',
      'south africa': '🇿🇦', 'afrique du sud': '🇿🇦',
      'madagascar': '🇲🇬',
      'tanzania': '🇹🇿', 'tanzanie': '🇹🇿',
      'uganda': '🇺🇬', 'ouganda': '🇺🇬',
      'ethiopia': '🇪🇹', 'éthiopie': '🇪🇹',
      'mauritius': '🇲🇺', 'maurice': '🇲🇺'
    };

    return map[c] || '🌍';
  }
}
