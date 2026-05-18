import type { ListingCardData } from '../../../components/shared/ListingCard';
import type { ListingListItemDto } from '../api/listingsApi';

export function mapListingToCard(item: ListingListItemDto): ListingCardData {
  return {
    slug: item.slug,
    name: item.name,
    location: item.location,
    amenities: item.amenities ?? [],
    packages: (item.packages ?? []).map((p) => ({ price: p.price })),
    totalReviews: item.totalReviews ?? 0,
    averageRating: item.averageRating,
    images: item.images,
    isFeatured: item.isFeatured,
    isVerified: item.isVerified,
  };
}
