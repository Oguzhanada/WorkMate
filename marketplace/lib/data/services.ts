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
    slug: 'home-cleaning',
    name: 'Home Cleaning',
    subcategories: [
      { slug: 'regular-cleaning', name: 'Regular Cleaning' },
      { slug: 'move-out-cleaning', name: 'Move-out Cleaning' },
      { slug: 'carpet-cleaning', name: 'Carpet Cleaning' },
      { slug: 'window-cleaning', name: 'Window Cleaning' },
      { slug: 'ironing-service', name: 'Ironing Service' }
    ]
  },
  {
    slug: 'repairs-renovation',
    name: 'Repairs & Renovation',
    subcategories: [
      { slug: 'electrical-work', name: 'Electrical Work' },
      { slug: 'plumbing-work', name: 'Plumbing Work' },
      { slug: 'painting-decorating', name: 'Painting & Decorating' },
      { slug: 'furniture-assembly', name: 'Furniture Assembly' },
      { slug: 'locksmith-service', name: 'Locksmith Service' }
    ]
  },
  {
    slug: 'garden-outdoor',
    name: 'Garden & Outdoor',
    subcategories: [
      { slug: 'lawn-mowing', name: 'Lawn Mowing' },
      { slug: 'tree-pruning', name: 'Tree Pruning' },
      { slug: 'landscape-design', name: 'Landscape Design' },
      { slug: 'fence-repair', name: 'Fence Repair' },
      { slug: 'pest-control', name: 'Pest Control' }
    ]
  },
  {
    slug: 'moving-transport',
    name: 'Moving & Transport',
    subcategories: [
      { slug: 'local-moving', name: 'Local Moving' },
      { slug: 'intercity-moving', name: 'Intercity Moving' },
      { slug: 'single-item-delivery', name: 'Single Item Delivery' },
      { slug: 'waste-removal', name: 'Waste Removal' }
    ]
  },
  {
    slug: 'tutoring-education',
    name: 'Tutoring & Education',
    subcategories: [
      { slug: 'math-tutoring', name: 'Math Tutoring' },
      { slug: 'english-tutoring', name: 'English Tutoring' },
      { slug: 'music-lessons', name: 'Music Lessons' },
      { slug: 'language-lessons', name: 'Language Lessons' },
      { slug: 'exam-prep', name: 'Exam Preparation' }
    ]
  },
  {
    slug: 'tech-support',
    name: 'Tech Support',
    subcategories: [
      { slug: 'computer-repair', name: 'Computer Repair' },
      { slug: 'software-installation', name: 'Software Installation' },
      { slug: 'virus-removal', name: 'Virus Removal' },
      { slug: 'website-setup', name: 'Website Setup' }
    ]
  },
  {
    slug: 'beauty-wellness',
    name: 'Beauty & Wellness',
    subcategories: [
      { slug: 'hairdresser-men', name: 'Hairdresser (Men)' },
      { slug: 'hairdresser-women', name: 'Hairdresser (Women)' },
      { slug: 'makeup-service', name: 'Makeup Service' },
      { slug: 'massage-therapy', name: 'Massage Therapy' },
      { slug: 'fitness-trainer', name: 'Fitness Trainer' }
    ]
  },
  {
    slug: 'events-media',
    name: 'Events & Media',
    subcategories: [
      { slug: 'photography', name: 'Photography' },
      { slug: 'videography', name: 'Videography' },
      { slug: 'dj-service', name: 'DJ Service' },
      { slug: 'event-planning', name: 'Event Planning' },
      { slug: 'invitation-design', name: 'Invitation Design' }
    ]
  },
  {
    slug: 'pet-care',
    name: 'Pet Care',
    subcategories: [
      { slug: 'dog-walking', name: 'Dog Walking' },
      { slug: 'pet-sitting', name: 'Pet Sitting' },
      { slug: 'pet-training', name: 'Pet Training' },
      { slug: 'veterinary-support', name: 'Veterinary Support' }
    ]
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    subcategories: [
      { slug: 'accounting-services', name: 'Accounting Services' },
      { slug: 'legal-consulting', name: 'Legal Consulting' },
      { slug: 'translation-services', name: 'Translation Services' },
      { slug: 'graphic-design', name: 'Graphic Design' },
      { slug: 'social-media-management', name: 'Social Media Management' }
    ]
  }
];

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
