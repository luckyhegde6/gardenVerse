import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { GeohashUtil } from '@/common/utils/geohash.util';
import { UpdateLocationDto, NearbyQueryDto } from './dto/geo.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly googleMapsUrl = 'https://maps.googleapis.com/maps/api';

  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const geohash = GeohashUtil.encode(dto.latitude, dto.longitude, 9);
    let region = dto.region;
    let address: string | undefined;

    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (apiKey) {
      try {
        const geocode = await this.reverseGeocode(dto.latitude, dto.longitude);
        if (geocode) {
          region = region || geocode.region;
          address = geocode.address;
        }
      } catch (err) {
        this.logger.debug(`Geocoding failed: ${err}`);
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { geohash, region: region || undefined },
    });

    if (address) {
      await this.prisma.garden.updateMany({
        where: { userId },
        data: { latitude: dto.latitude, longitude: dto.longitude, address },
      });
    }

    return { geohash, region, address };
  }

  async reverseGeocode(lat: number, lng: number): Promise<{ region: string; address: string } | null> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return null;

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.googleMapsUrl}/geocode/json`, {
          params: { latlng: `${lat},${lng}`, key: apiKey },
        }),
      );

      if (data.status !== 'OK' || !data.results?.[0]) return null;

      const result = data.results[0];
      const components = result.address_components || [];
      const regionComponent = components.find(
        (c: any) => c.types.includes('administrative_area_level_1') || c.types.includes('country'),
      );

      return {
        region: regionComponent?.long_name || components[0]?.long_name || 'Unknown',
        address: result.formatted_address,
      };
    } catch {
      return null;
    }
  }

  async searchPlace(query: string) {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return [];

    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.googleMapsUrl}/place/textsearch/json`, {
          params: { query, key: apiKey },
        }),
      );

      return (data.results || []).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        rating: place.rating,
        types: place.types,
      }));
    } catch (err) {
      this.logger.warn(`Google Places search failed: ${err}`);
      return [];
    }
  }

  async getNearbyGardeners(query: NearbyQueryDto) {
    const { geohash, radius = 10, limit = 20 } = query;
    const precision = radius <= 1 ? 9 : radius <= 5 ? 7 : radius <= 20 ? 6 : 5;
    const prefix = geohash.slice(0, precision);

    const users = await this.prisma.user.findMany({
      where: {
        geohash: { startsWith: prefix },
        garden: { isNot: null },
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        geohash: true,
        region: true,
        sustainabilityScore: true,
      },
    });

    const mapped = users.map(u => {
      const coords = u.geohash ? GeohashUtil.decode(u.geohash) : null;
      return { ...u, latitude: coords?.lat, longitude: coords?.lng };
    });

    return { count: mapped.length, gardeners: mapped };
  }

  async getRegionalStats(region: string) {
    const [totalUsers, totalGardens, totalCrops] = await Promise.all([
      this.prisma.user.count({ where: { region: { contains: region, mode: 'insensitive' } } }),
      this.prisma.garden.count({
        where: { user: { region: { contains: region, mode: 'insensitive' } } },
      }),
      this.prisma.crop.count({
        where: { user: { region: { contains: region, mode: 'insensitive' } } },
      }),
    ]);
    return { region, totalUsers, totalGardens, totalCrops };
  }

  async getRegionalLeaderboard(region: string) {
    return this.prisma.user.findMany({
      where: { region: { contains: region, mode: 'insensitive' } },
      orderBy: { sustainabilityScore: 'desc' },
      take: 20,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        sustainabilityScore: true,
        level: true,
      },
    });
  }
}
