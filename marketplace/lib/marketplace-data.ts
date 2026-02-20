export type ServiceItem = {
  slug: string;
  name: string;
  category: string;
  city: string;
  priceRange: string;
  summary: string;
  heroImage: string;
};

export type ProfessionalItem = {
  id: string;
  name: string;
  city: string;
  services: string[];
  rating: number;
  reviews: number;
  startingPrice: string;
  image: string;
  verified: boolean;
};

export const services: ServiceItem[] = [
  {
    slug: 'ev-temizligi',
    name: 'Home Cleaning',
    category: 'Cleaning',
    city: 'Dublin',
    priceRange: 'EUR80-EUR180',
    summary: 'Weekly, deep and move-out cleaning by verified teams.',
    heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'boya-badana',
    name: 'Painting',
    category: 'Renovation',
    city: 'Cork',
    priceRange: 'EUR250-EUR1200',
    summary: 'Interior and exterior painting with material options.',
    heroImage: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'nakliyat',
    name: 'Intercity Moving',
    category: 'Moving',
    city: 'Galway',
    priceRange: 'EUR300-EUR1500',
    summary: 'Insured moving teams for apartments and offices.',
    heroImage: 'https://images.unsplash.com/photo-1600518464441-9306b7c4f605?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'klima-servisi',
    name: 'AC Service',
    category: 'Repair',
    city: 'Istanbul',
    priceRange: 'EUR60-EUR220',
    summary: 'Maintenance, gas refill and urgent repair visits.',
    heroImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80'
  }
];

export const professionals: ProfessionalItem[] = [
  {
    id: 'pro-1',
    name: 'Ahmet Yilmaz',
    city: 'Istanbul',
    services: ['ev-temizligi', 'nakliyat'],
    rating: 4.9,
    reviews: 412,
    startingPrice: 'EUR95',
    image: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-2',
    name: 'Maria Silva',
    city: 'Sao Paulo',
    services: ['ev-temizligi', 'boya-badana'],
    rating: 4.8,
    reviews: 287,
    startingPrice: 'EUR88',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-3',
    name: 'Juan Lopez',
    city: 'Madrid',
    services: ['boya-badana'],
    rating: 4.9,
    reviews: 354,
    startingPrice: 'EUR270',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-4',
    name: 'Eoin Murphy',
    city: 'Dublin',
    services: ['ev-temizligi', 'klima-servisi'],
    rating: 4.8,
    reviews: 219,
    startingPrice: 'EUR105',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-5',
    name: 'Seda Demir',
    city: 'Istanbul',
    services: ['ev-temizligi'],
    rating: 4.9,
    reviews: 498,
    startingPrice: 'EUR90',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-6',
    name: 'Lucas Rocha',
    city: 'Sao Paulo',
    services: ['nakliyat'],
    rating: 4.8,
    reviews: 175,
    startingPrice: 'EUR320',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-7',
    name: 'Nora O\'Brien',
    city: 'Galway',
    services: ['klima-servisi', 'boya-badana'],
    rating: 4.8,
    reviews: 202,
    startingPrice: 'EUR75',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-8',
    name: 'Carlos Mendez',
    city: 'Madrid',
    services: ['nakliyat', 'ev-temizligi'],
    rating: 4.9,
    reviews: 261,
    startingPrice: 'EUR110',
    image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=500&q=80',
    verified: true
  }
];

export const serviceFaq = [
  {
    question: 'How quickly can I get quotes?',
    answer: 'Most requests receive the first quote within 30 minutes during business hours.'
  },
  {
    question: 'Are professionals background-checked?',
    answer: 'Profiles are reviewed with ID and business verification before becoming visible to customers.'
  },
  {
    question: 'What if I am not satisfied?',
    answer: 'Our support team reviews every dispute and offers first-job money-back protection where eligible.'
  }
];

export const teamMembers = [
  {
    name: 'Elif Kaya',
    role: 'CEO',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Bruno Costa',
    role: 'Head of Operations',
    image: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'Laura Garcia',
    role: 'Head of Product',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&q=80'
  }
];
