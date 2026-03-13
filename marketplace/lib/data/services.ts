export type ServiceCategoryGroup = {
  slug: string;
  name: string;
  subcategories: Array<{
    slug: string;
    name: string;
  }>;
};

export type TaxonomyCategoryRow = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export const SERVICE_TAXONOMY: ServiceCategoryGroup[] = [
  {
    slug: 'cleaning',
    name: 'Cleaning',
    subcategories: [
      { slug: 'home-cleaning', name: 'Home Cleaning' },
      { slug: 'deep-cleaning', name: 'Deep Cleaning' },
      { slug: 'move-out-cleaning', name: 'Move-out Cleaning' },
      { slug: 'end-of-tenancy-cleaning', name: 'End of Tenancy Cleaning' },
      { slug: 'carpet-cleaning', name: 'Carpet Cleaning' },
      { slug: 'window-cleaning', name: 'Window Cleaning' },
      { slug: 'oven-cleaning', name: 'Oven Cleaning' },
      { slug: 'after-builders-cleaning', name: 'After Builders Cleaning' },
      { slug: 'airbnb-cleaning', name: 'Airbnb / Short-let Cleaning' },
      { slug: 'office-cleaning', name: 'Office Cleaning' },
      { slug: 'upholstery-cleaning', name: 'Upholstery & Sofa Cleaning' }
    ]
  },
  {
    slug: 'handyman',
    name: 'Handyman',
    subcategories: [
      { slug: 'general-handyman', name: 'General Handyman' },
      { slug: 'flat-pack-assembly', name: 'Flat-Pack Assembly' },
      { slug: 'tv-wall-mounting', name: 'TV Wall Mounting' },
      { slug: 'curtain-rail-installation', name: 'Curtain Rail Installation' },
      { slug: 'blind-installation', name: 'Blind Installation' },
      { slug: 'shelf-installation', name: 'Shelf Installation' },
      { slug: 'mirror-hanging', name: 'Mirror / Picture Hanging' },
      { slug: 'door-lock-installation', name: 'Door Lock Installation' },
      { slug: 'property-maintenance', name: 'Property Maintenance' }
    ]
  },
  {
    slug: 'garden-outdoor',
    name: 'Garden & Outdoor',
    subcategories: [
      { slug: 'lawn-mowing', name: 'Lawn Mowing' },
      { slug: 'garden-clearance', name: 'Garden Clearance' },
      { slug: 'hedge-trimming', name: 'Hedge & Shrub Trimming' },
      { slug: 'tree-surgery', name: 'Tree Surgery' },
      { slug: 'garden-planting', name: 'Garden Planting' },
      { slug: 'turf-laying', name: 'Turf Laying' },
      { slug: 'fencing', name: 'Fencing' },
      { slug: 'decking', name: 'Decking' },
      { slug: 'pond-maintenance', name: 'Garden Pond Maintenance' },
      { slug: 'garden-design', name: 'Garden Design' }
    ]
  },
  {
    slug: 'painting-decorating',
    name: 'Painting & Decorating',
    subcategories: [
      { slug: 'interior-painting', name: 'Interior Painting' },
      { slug: 'exterior-painting', name: 'Exterior Painting' },
      { slug: 'wallpapering', name: 'Wallpapering' },
      { slug: 'paint-stripping', name: 'Paint Stripping' },
      { slug: 'fence-painting', name: 'Fence Painting' },
      { slug: 'furniture-painting', name: 'Furniture Painting' },
      { slug: 'commercial-painting', name: 'Commercial Painting' }
    ]
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    subcategories: [
      { slug: 'general-plumbing', name: 'General Plumbing' },
      { slug: 'drain-cleaning', name: 'Drain Cleaning' },
      { slug: 'boiler-service', name: 'Boiler Service & Repair' },
      { slug: 'shower-installation', name: 'Shower Installation' },
      { slug: 'toilet-installation', name: 'Toilet Installation' },
      { slug: 'pipe-repair', name: 'Pipe Repair' },
      { slug: 'leak-detection', name: 'Leak Detection' },
      { slug: 'water-heater-installation', name: 'Water Heater Installation' }
    ]
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    subcategories: [
      { slug: 'general-electrical', name: 'General Electrical Work' },
      { slug: 'light-installation', name: 'Light Installation' },
      { slug: 'socket-switch-installation', name: 'Socket & Switch Installation' },
      { slug: 'smoke-alarm-installation', name: 'Smoke Alarm Installation' },
      { slug: 'air-conditioning', name: 'Air Conditioning Installation' },
      { slug: 'solar-panel-installation', name: 'Solar Panel Installation' },
      { slug: 'ev-charger-installation', name: 'EV Charger Installation' },
      { slug: 'consumer-unit-upgrade', name: 'Consumer Unit Upgrade' },
      { slug: 'cctv-installation', name: 'CCTV Installation' }
    ]
  },
  {
    slug: 'flooring',
    name: 'Flooring',
    subcategories: [
      { slug: 'laminate-flooring', name: 'Laminate Flooring' },
      { slug: 'hardwood-flooring', name: 'Hardwood Flooring' },
      { slug: 'vinyl-flooring', name: 'Vinyl Flooring' },
      { slug: 'carpet-laying', name: 'Carpet Laying' },
      { slug: 'tiling', name: 'Tiling' },
      { slug: 'regrouting', name: 'Regrouting' },
      { slug: 'floor-sanding', name: 'Floor Sanding & Finishing' },
      { slug: 'timber-flooring', name: 'Timber Flooring' }
    ]
  },
  {
    slug: 'roofing-insulation',
    name: 'Roofing & Insulation',
    subcategories: [
      { slug: 'roof-repair', name: 'Roof Repair' },
      { slug: 'flat-roofing', name: 'Flat Roofing' },
      { slug: 'gutter-cleaning', name: 'Gutter Cleaning' },
      { slug: 'gutter-repair', name: 'Gutter Repair & Installation' },
      { slug: 'chimney-sweep', name: 'Chimney Sweep' },
      { slug: 'insulation', name: 'Insulation' },
      { slug: 'skylight-installation', name: 'Skylight Installation' },
      { slug: 'solar-panel-cleaning', name: 'Solar Panel Cleaning' }
    ]
  },
  {
    slug: 'carpentry-joinery',
    name: 'Carpentry & Joinery',
    subcategories: [
      { slug: 'furniture-assembly', name: 'Furniture Assembly' },
      { slug: 'ikea-assembly', name: 'IKEA Assembly' },
      { slug: 'custom-shelving', name: 'Custom Shelving' },
      { slug: 'cabinet-making', name: 'Cabinet Making' },
      { slug: 'bespoke-furniture', name: 'Bespoke Furniture' },
      { slug: 'wood-repair', name: 'Wood Repair & Restoration' },
      { slug: 'door-fitting', name: 'Door Fitting' },
      { slug: 'staircase-renovation', name: 'Staircase Renovation' }
    ]
  },
  {
    slug: 'paving-driveways',
    name: 'Paving & Driveways',
    subcategories: [
      { slug: 'paving', name: 'Paving' },
      { slug: 'concreting', name: 'Concreting' },
      { slug: 'driveway-installation', name: 'Driveway Installation' },
      { slug: 'driveway-repair', name: 'Driveway Repair' },
      { slug: 'retaining-walls', name: 'Retaining Walls' },
      { slug: 'path-laying', name: 'Path Laying' },
      { slug: 'garden-walls', name: 'Garden Walls' }
    ]
  },
  {
    slug: 'home-renovation',
    name: 'Home Renovation',
    subcategories: [
      { slug: 'kitchen-fitting', name: 'Kitchen Fitting' },
      { slug: 'bathroom-renovation', name: 'Bathroom Renovation' },
      { slug: 'loft-conversion', name: 'Loft Conversion' },
      { slug: 'house-extension', name: 'House Extension' },
      { slug: 'garage-conversion', name: 'Garage Conversion' },
      { slug: 'interior-design', name: 'Interior Design' },
      { slug: 'plastering', name: 'Plastering' },
      { slug: 'rendering', name: 'Rendering' },
      { slug: 'architect', name: 'Architect' }
    ]
  },
  {
    slug: 'moving-removals',
    name: 'Moving & Removals',
    subcategories: [
      { slug: 'local-moving', name: 'Local Moving' },
      { slug: 'intercity-moving', name: 'Intercity Moving' },
      { slug: 'furniture-removal', name: 'Furniture Removal' },
      { slug: 'single-item-delivery', name: 'Single Item Delivery' },
      { slug: 'piano-removal', name: 'Piano Removal' },
      { slug: 'office-relocation', name: 'Office Relocation' },
      { slug: 'man-with-a-van', name: 'Man with a Van' },
      { slug: 'storage', name: 'Storage' }
    ]
  },
  {
    slug: 'waste-clearance',
    name: 'Waste & Clearance',
    subcategories: [
      { slug: 'rubbish-removal', name: 'Rubbish Removal' },
      { slug: 'house-clearance', name: 'House Clearance' },
      { slug: 'garden-waste-removal', name: 'Garden Waste Removal' },
      { slug: 'skip-hire', name: 'Skip Hire' },
      { slug: 'attic-clearance', name: 'Attic Clearance' },
      { slug: 'garage-clearance', name: 'Garage Clearance' },
      { slug: 'office-clearance', name: 'Office Clearance' },
      { slug: 'mattress-removal', name: 'Mattress & White Goods Removal' }
    ]
  },
  {
    slug: 'car-vehicle',
    name: 'Car & Vehicle',
    subcategories: [
      { slug: 'car-wash', name: 'Car Wash' },
      { slug: 'car-detailing', name: 'Car Detailing & Valeting' },
      { slug: 'car-servicing', name: 'Car Servicing' },
      { slug: 'mobile-mechanic', name: 'Mobile Mechanic' },
      { slug: 'tyre-fitting', name: 'Tyre Fitting' },
      { slug: 'car-bodywork', name: 'Car Bodywork & Paint' },
      { slug: 'car-scratch-repair', name: 'Car Scratch & Dent Repair' },
      { slug: 'windscreen-repair', name: 'Windscreen Repair / Replacement' },
      { slug: 'pre-purchase-inspection', name: 'Pre-Purchase Inspection' }
    ]
  },
  {
    slug: 'beauty-wellness',
    name: 'Beauty & Wellness',
    subcategories: [
      { slug: 'hairdresser', name: 'Hairdresser' },
      { slug: 'mobile-hairdresser', name: 'Mobile Hairdresser' },
      { slug: 'barber', name: 'Barber' },
      { slug: 'beautician', name: 'Beautician' },
      { slug: 'nail-technician', name: 'Nail Technician' },
      { slug: 'eyebrow-threading', name: 'Eyebrow Threading & Tinting' },
      { slug: 'eyelash-extension', name: 'Eyelash Extension' },
      { slug: 'spray-tanning', name: 'Spray Tanning' },
      { slug: 'makeup-artist', name: 'Makeup Artist' },
      { slug: 'waxing', name: 'Waxing' }
    ]
  },
  {
    slug: 'health-fitness',
    name: 'Health & Fitness',
    subcategories: [
      { slug: 'personal-training', name: 'Personal Training' },
      { slug: 'yoga-instructor', name: 'Yoga Instructor' },
      { slug: 'pilates', name: 'Pilates' },
      { slug: 'physiotherapy', name: 'Physiotherapy' },
      { slug: 'nutritionist', name: 'Nutritionist / Dietitian' },
      { slug: 'massage-therapy', name: 'Massage Therapy' },
      { slug: 'life-coaching', name: 'Life Coaching' },
      { slug: 'mental-health-counselling', name: 'Mental Health Counselling' }
    ]
  },
  {
    slug: 'pet-care',
    name: 'Pet Care',
    subcategories: [
      { slug: 'dog-walking', name: 'Dog Walking' },
      { slug: 'dog-sitting', name: 'Dog Sitting' },
      { slug: 'dog-grooming', name: 'Dog Grooming' },
      { slug: 'dog-training', name: 'Dog Training' },
      { slug: 'cat-sitting', name: 'Cat Sitting' },
      { slug: 'pet-boarding', name: 'Pet Boarding' },
      { slug: 'mobile-dog-grooming', name: 'Mobile Dog Grooming' },
      { slug: 'puppy-training', name: 'Puppy Training' }
    ]
  },
  {
    slug: 'childcare-family',
    name: 'Childcare & Family',
    subcategories: [
      { slug: 'babysitting', name: 'Babysitting' },
      { slug: 'nanny', name: 'Nanny' },
      { slug: 'childminder', name: 'Childminder' },
      { slug: 'baby-proofing', name: 'Baby Proofing' },
      { slug: 'au-pair', name: 'Au Pair' }
    ]
  },
  {
    slug: 'events-entertainment',
    name: 'Events & Entertainment',
    subcategories: [
      { slug: 'wedding-photography', name: 'Wedding Photography' },
      { slug: 'event-photography', name: 'Event Photography' },
      { slug: 'videography', name: 'Videography' },
      { slug: 'dj-services', name: 'DJ Services' },
      { slug: 'party-catering', name: 'Party Catering' },
      { slug: 'event-decoration', name: 'Event Decoration' },
      { slug: 'face-painting', name: 'Face Painting' },
      { slug: 'magician', name: 'Magician' },
      { slug: 'wedding-planning', name: 'Wedding Planning' },
      { slug: 'live-entertainment', name: 'Live Entertainment' }
    ]
  },
  {
    slug: 'tech-it',
    name: 'Tech & IT',
    subcategories: [
      { slug: 'computer-repair', name: 'Computer Repair' },
      { slug: 'laptop-repair', name: 'Laptop Repair' },
      { slug: 'phone-repair', name: 'Phone Repair' },
      { slug: 'it-support', name: 'IT Support' },
      { slug: 'virus-removal', name: 'Virus Removal' },
      { slug: 'wifi-setup', name: 'WiFi Setup' },
      { slug: 'home-network-setup', name: 'Home Network Setup' },
      { slug: 'data-recovery', name: 'Data Recovery' },
      { slug: 'smart-home-setup', name: 'Smart Home Setup' }
    ]
  },
  {
    slug: 'tutoring-education',
    name: 'Tutoring & Education',
    subcategories: [
      { slug: 'maths-tutoring', name: 'Maths Tutoring' },
      { slug: 'english-tutoring', name: 'English Tutoring' },
      { slug: 'science-tutoring', name: 'Science Tutoring' },
      { slug: 'music-lessons', name: 'Music Lessons' },
      { slug: 'guitar-lessons', name: 'Guitar Lessons' },
      { slug: 'piano-lessons', name: 'Piano Lessons' },
      { slug: 'language-lessons', name: 'Language Lessons' },
      { slug: 'art-tutoring', name: 'Art Tutoring' },
      { slug: 'exam-preparation', name: 'Exam Preparation' }
    ]
  },
  {
    slug: 'laundry-alterations',
    name: 'Laundry & Alterations',
    subcategories: [
      { slug: 'ironing', name: 'Ironing' },
      { slug: 'dry-cleaning', name: 'Dry Cleaning' },
      { slug: 'dressmaking', name: 'Dressmaking' },
      { slug: 'clothing-repair', name: 'Clothing Repair' },
      { slug: 'tailoring', name: 'Tailoring' },
      { slug: 'embroidery', name: 'Embroidery' },
      { slug: 'wedding-dress-alteration', name: 'Wedding Dress Alteration' }
    ]
  },
  {
    slug: 'pest-control',
    name: 'Pest Control',
    subcategories: [
      { slug: 'general-pest-control', name: 'General Pest Control' },
      { slug: 'rodent-control', name: 'Rodent Control' },
      { slug: 'wasp-nest-removal', name: 'Wasp Nest Removal' },
      { slug: 'ant-treatment', name: 'Ant Treatment' },
      { slug: 'bed-bug-treatment', name: 'Bed Bug Treatment' },
      { slug: 'flea-treatment', name: 'Flea Treatment' }
    ]
  },
  {
    slug: 'business-professional',
    name: 'Business & Professional',
    subcategories: [
      { slug: 'accounting-services', name: 'Accounting Services' },
      { slug: 'tax-advice', name: 'Tax Advice' },
      { slug: 'graphic-design', name: 'Graphic Design' },
      { slug: 'social-media-marketing', name: 'Social Media Marketing' },
      { slug: 'translation-services', name: 'Translation Services' },
      { slug: 'virtual-assistant', name: 'Virtual Assistant' },
      { slug: 'business-consulting', name: 'Business Consulting' },
      { slug: 'web-design', name: 'Web Design' },
      { slug: 'legal-consulting', name: 'Legal Consulting' }
    ]
  },
  {
    slug: 'writing-creative',
    name: 'Writing & Creative',
    subcategories: [
      { slug: 'copywriting', name: 'Copywriting' },
      { slug: 'blog-writing', name: 'Blog Writing' },
      { slug: 'proofreading', name: 'Proofreading' },
      { slug: 'resume-writing', name: 'CV / Resume Writing' },
      { slug: 'ghostwriting', name: 'Ghostwriting' },
      { slug: 'illustration', name: 'Illustration' },
      { slug: 'content-creation', name: 'Content Creation' },
      { slug: 'speech-writing', name: 'Speech Writing' }
    ]
  }
];

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
    slug: 'home-cleaning',
    name: 'Home Cleaning',
    category: 'Cleaning',
    city: 'Dublin',
    priceRange: 'EUR80-EUR180',
    summary: 'Weekly, deep and move-out cleaning by verified teams.',
    heroImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'painting-decorating',
    name: 'Painting & Decorating',
    category: 'Painting & Decorating',
    city: 'Cork',
    priceRange: 'EUR250-EUR1200',
    summary: 'Interior and exterior painting with material options.',
    heroImage: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'moving-services',
    name: 'Intercity Moving',
    category: 'Moving & Removals',
    city: 'Galway',
    priceRange: 'EUR300-EUR1500',
    summary: 'Insured moving teams for apartments and offices.',
    heroImage: 'https://images.unsplash.com/photo-1600518464441-9306b7c4f605?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'ac-service',
    name: 'AC Service',
    category: 'Electrical',
    city: 'Limerick',
    priceRange: 'EUR60-EUR220',
    summary: 'Maintenance, gas refill and urgent repair visits.',
    heroImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'garden-maintenance',
    name: 'Garden Maintenance',
    category: 'Garden & Outdoor',
    city: 'Galway',
    priceRange: 'EUR70-EUR240',
    summary: 'Lawn care, hedge trimming and seasonal cleanup.',
    heroImage: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1400&q=80'
  },
  {
    slug: 'dog-walking',
    name: 'Dog Walking',
    category: 'Pet Care',
    city: 'Cork',
    priceRange: 'EUR20-EUR65',
    summary: 'Trusted local walkers for daily and weekend schedules.',
    heroImage: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1400&q=80'
  }
];

export const professionals: ProfessionalItem[] = [
  {
    id: 'pro-1',
    name: 'Ahmet Yilmaz',
    city: 'Cork',
    services: ['home-cleaning', 'moving-services'],
    rating: 4.9,
    reviews: 412,
    startingPrice: 'EUR95',
    image: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-2',
    name: 'Maria Silva',
    city: 'Limerick',
    services: ['home-cleaning', 'painting-decorating'],
    rating: 4.8,
    reviews: 287,
    startingPrice: 'EUR88',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-3',
    name: 'Juan Lopez',
    city: 'Waterford',
    services: ['painting-decorating'],
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
    services: ['home-cleaning', 'ac-service'],
    rating: 4.8,
    reviews: 219,
    startingPrice: 'EUR105',
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-5',
    name: 'Seda Demir',
    city: 'Kilkenny',
    services: ['home-cleaning'],
    rating: 4.9,
    reviews: 498,
    startingPrice: 'EUR90',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-6',
    name: 'Lucas Rocha',
    city: 'Wexford',
    services: ['moving-services'],
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
    services: ['ac-service', 'painting-decorating'],
    rating: 4.8,
    reviews: 202,
    startingPrice: 'EUR75',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80',
    verified: true
  },
  {
    id: 'pro-8',
    name: 'Carlos Mendez',
    city: 'Cork',
    services: ['moving-services', 'home-cleaning'],
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

/* teamMembers removed — about page now uses inline founder description */

export function getTaxonomySuggestions(limit = 12): string[] {
  return SERVICE_TAXONOMY.flatMap((group) => group.subcategories.map((item) => item.name)).slice(
    0,
    limit
  );
}

export function getTaxonomyCategories(): TaxonomyCategoryRow[] {
  let order = 1;

  return SERVICE_TAXONOMY.flatMap((group, groupIndex) => {
    const parentId = `fallback-parent-${groupIndex + 1}`;
    const parent: TaxonomyCategoryRow = {
      id: parentId,
      slug: group.slug,
      name: group.name,
      parent_id: null,
      sort_order: order++
    };

    const children: TaxonomyCategoryRow[] = group.subcategories.map((subcategory) => ({
      id: `fallback-child-${subcategory.slug}`,
      slug: subcategory.slug,
      name: subcategory.name,
      parent_id: parentId,
      sort_order: order++
    }));

    return [parent, ...children];
  });
}
