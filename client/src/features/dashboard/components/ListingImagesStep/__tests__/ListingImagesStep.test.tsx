import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../../../i18n';
import * as listingImageUploadApi from '../../../../listings/api/listingImageUploadApi';
import * as prepareListingImageModule from '../../../../../utils/prepareListingImage';
import {
  ListingImagesStep,
  listingImagesToPayload,
  type ListingImageDraft,
} from '../ListingImagesStep';

describe('listingImagesToPayload', () => {
  it('maps ready images with single main and order', () => {
    const images: ListingImageDraft[] = [
      {
        id: 'a',
        url: 'https://cdn.example/a.webp',
        publicId: 'a',
        altAr: 'أ',
        altEn: 'A',
        isMain: false,
        order: 1,
        status: 'ready',
      },
      {
        id: 'b',
        url: 'https://cdn.example/b.webp',
        altAr: 'ب',
        altEn: 'B',
        isMain: true,
        order: 0,
        status: 'ready',
      },
    ];

    const payload = listingImagesToPayload(images);
    expect(payload).toHaveLength(2);
    expect(payload[0]?.url).toBe('https://cdn.example/b.webp');
    expect(payload[0]?.isMain).toBe(true);
    expect(payload[0]?.order).toBe(0);
    expect(payload[1]?.isMain).toBe(false);
  });

  it('skips non-ready drafts', () => {
    const images: ListingImageDraft[] = [
      {
        id: 'a',
        url: 'https://cdn.example/a.webp',
        altAr: 'أ',
        altEn: 'A',
        isMain: true,
        order: 0,
        status: 'uploading',
      },
    ];
    expect(listingImagesToPayload(images)).toHaveLength(0);
  });
});

describe('ListingImagesStep', () => {
  it('renders add photos control', async () => {
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <ListingImagesStep
          images={[]}
          onChange={jest.fn()}
          nameAr="نادي"
          nameEn="Gym"
        />
      </I18nextProvider>,
    );
    expect(screen.getByTestId('listing-images-step')).toBeInTheDocument();
    expect(screen.getByText('Add photos')).toBeInTheDocument();
  });

  it('marks image ready after upload without reverting to uploading', async () => {
    await i18n.changeLanguage('en');

    const preparedFile = new File([new Uint8Array([1, 2, 3])], 'gym.webp', {
      type: 'image/webp',
    });

    jest.spyOn(prepareListingImageModule, 'prepareListingImage').mockResolvedValue({
      file: preparedFile,
      originalBytes: 5000,
      compressedBytes: 900,
    });

    jest.spyOn(listingImageUploadApi, 'uploadListingImage').mockResolvedValue({
      url: 'http://localhost:4000/uploads/listings/test.webp',
      publicId: 'listings/test',
      alt: { ar: 'نادي', en: 'Gym' },
    });

    function Harness() {
      const [images, setImages] = useState<ListingImageDraft[]>([]);
      return (
        <ListingImagesStep
          images={images}
          onChange={setImages}
          nameAr="نادي"
          nameEn="Gym"
        />
      );
    }

    render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>,
    );

    const input = screen.getByTestId('listing-images-input');
    await userEvent.upload(input, preparedFile);

    await waitFor(() => {
      expect(screen.queryByText('Processing and uploading…')).not.toBeInTheDocument();
    });

    expect(
      await screen.findByDisplayValue('نادي', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });
});
