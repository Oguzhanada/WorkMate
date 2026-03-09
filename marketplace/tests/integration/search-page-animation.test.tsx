import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import SearchPage from '@/app/[locale]/search/page';

const pushMock = vi.fn();

vi.mock('next/link', () => ({
  default: ({children, href, ...rest}: Record<string, unknown>) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  )
}));

vi.mock('@/components/site/VerifiedNavigationLink', () => ({
  default: ({children, href, ...rest}: Record<string, unknown>) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  )
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({push: pushMock}),
  usePathname: () => '/search',
  useSearchParams: () => new URLSearchParams('q=cleaning&county=Dublin&mode=services')
}));

vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      search: {
        title: 'Search results',
        subtitle: 'Showing results for',
        maxPrice: 'Max price (EUR)',
        allPrices: 'No price limit',
        minRating: 'Minimum rating',
        allRatings: 'All ratings',
        filtersTitle: 'Filter results',
        clear: 'Clear filters',
        noResults: 'No results',
        allCities: 'All cities'
      },
      common: {
        city: 'City',
        viewDetails: 'View details',
        reviews: 'reviews',
        from: 'From',
        requestQuote: 'Request quote'
      },
      home: {
        'trend.homeCleaning': 'Home Cleaning',
        'trend.painting': 'Painting',
        'trend.moving': 'Moving',
        'trend.acRepair': 'AC Repair'
      }
    };
    return dict[ns]?.[key] ?? `${ns}.${key}`;
  }
}));

describe('Search page interactions', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('shows refresh feedback and skeleton placeholders when filters change', async () => {
    render(<SearchPage />);

    const maxPriceSelect = screen.getByLabelText('Max price (EUR)');
    await userEvent.selectOptions(maxPriceSelect, '200');

    expect(screen.getByText('Updating results...')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading results')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Updating results...')).not.toBeInTheDocument();
    });
  });

  it('opens and closes mobile filter drawer', async () => {
    render(<SearchPage />);

    await userEvent.click(screen.getByRole('button', {name: 'Filters'}));
    expect(screen.getByRole('button', {name: 'Apply'})).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', {name: 'Close'}));
    await waitFor(() => {
      expect(screen.queryByRole('button', {name: 'Apply'})).not.toBeInTheDocument();
    });
  });
});
