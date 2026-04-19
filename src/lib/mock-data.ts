import { AppData } from './types';

export const INITIAL_DATA: AppData = {
  clients: [
    {
      id: 'c1',
      name: 'Kofi Mensah',
      businessName: 'Kofi\'s Crafts',
      phone: '+233 24 123 4567',
      email: 'kofi@crafts.com',
      location: 'Accra, Ghana',
      avatarUrl: 'https://picsum.photos/seed/kofi/600/400',
      notes: 'Loves clean, modern designs and high-contrast visuals.',
      createdAt: '2023-10-01'
    },
    {
      id: 'c2',
      name: 'Sarah Jenkins',
      businessName: 'Jenkins Bakery',
      phone: '+1 555 123 4567',
      email: 'sarah@bakery.com',
      location: 'Portland, OR',
      avatarUrl: 'https://picsum.photos/seed/sarah/600/400',
      notes: 'Needs regular blog updates and seasonal promotional banners.',
      createdAt: '2023-11-15'
    },
    {
      id: 'c3',
      name: 'Marco Rossi',
      businessName: 'Rossi Interiors',
      phone: '+39 02 123 4567',
      email: 'marco@rossi.it',
      location: 'Milan, Italy',
      avatarUrl: 'https://picsum.photos/seed/marco/600/400',
      notes: 'High-end furniture showroom. Requires high-res image optimization.',
      createdAt: '2024-01-20'
    },
    {
      id: 'c4',
      name: 'Elena Petrova',
      businessName: 'Petrova Legal',
      phone: '+359 2 987 6543',
      email: 'elena@petrova-legal.bg',
      location: 'Sofia, Bulgaria',
      avatarUrl: 'https://picsum.photos/seed/elena/600/400',
      notes: 'Professional law firm. Prefers conservative, authoritative color palettes.',
      createdAt: '2024-02-05'
    },
    {
      id: 'c5',
      name: 'Jack Thorne',
      businessName: 'Thorne Outdoors',
      phone: '+1 604 555 0199',
      email: 'jack@thorneoutdoors.ca',
      location: 'Vancouver, Canada',
      avatarUrl: 'https://picsum.photos/seed/jack/600/400',
      notes: 'Adventure gear retailer. Needs a focus on mobile responsiveness for hikers.',
      createdAt: '2024-02-12'
    },
    {
      id: 'c6',
      name: 'Mei Lin',
      businessName: 'Lin\'s Tea House',
      phone: '+81 75 123 4567',
      email: 'mei@linstea.jp',
      location: 'Kyoto, Japan',
      avatarUrl: 'https://picsum.photos/seed/mei/600/400',
      notes: 'Traditional tea ceremonies. Aesthetic must be minimalist and serene.',
      createdAt: '2024-02-18'
    },
    {
      id: 'c7',
      name: 'Anita Desai',
      businessName: 'Desai Tech',
      phone: '+91 80 4567 8901',
      email: 'anita@desaitech.in',
      location: 'Bangalore, India',
      avatarUrl: 'https://picsum.photos/seed/anita/600/400',
      notes: 'SaaS startup. Fast-paced environment with frequent feature requests.',
      createdAt: '2024-03-01'
    },
    {
      id: 'c8',
      name: 'Carlos Mendez',
      businessName: 'Mendez Tapas',
      phone: '+34 93 123 4567',
      email: 'carlos@mendeztapas.es',
      location: 'Barcelona, Spain',
      avatarUrl: 'https://picsum.photos/seed/carlos/600/400',
      notes: 'Vibrant restaurant. Needs integration with reservation platforms.',
      createdAt: '2024-03-05'
    },
    {
      id: 'c9',
      name: 'Sophie Laurent',
      businessName: 'Laurent Mode',
      phone: '+33 1 45 67 89 00',
      email: 'sophie@laurentmode.fr',
      location: 'Paris, France',
      avatarUrl: 'https://picsum.photos/seed/sophie/600/400',
      notes: 'Boutique fashion house. Strong focus on visual storytelling and high-res video.',
      createdAt: '2024-03-10'
    },
    {
      id: 'c10',
      name: 'David Smith',
      businessName: 'Smith Financial',
      phone: '+44 20 7946 0000',
      email: 'david@smithfinancial.co.uk',
      location: 'London, UK',
      avatarUrl: 'https://picsum.photos/seed/david/600/400',
      notes: 'Wealth management. Security and data privacy are top priorities.',
      createdAt: '2024-03-12'
    }
  ],
  websites: [
    {
      id: 'w1',
      clientId: 'c1',
      domainName: 'koficrafts.com',
      url: 'https://koficrafts.com',
      hostingProvider: 'Bluehost',
      platform: 'WordPress',
      dateCreated: '2023-10-05',
      projectPrice: 1500,
      paymentStatus: 'Paid',
      expiryDate: '2024-12-05'
    },
    {
      id: 'w2',
      clientId: 'c2',
      domainName: 'jenkinsbakery.com',
      url: 'https://jenkinsbakery.com',
      hostingProvider: 'SiteGround',
      platform: 'WordPress',
      dateCreated: '2023-11-20',
      projectPrice: 1200,
      paymentStatus: 'Unpaid',
      expiryDate: '2024-03-20'
    },
    {
      id: 'w3',
      clientId: 'c3',
      domainName: 'rossi-interiors.it',
      url: 'https://rossi-interiors.it',
      hostingProvider: 'Kinsta',
      platform: 'WordPress',
      dateCreated: '2024-01-25',
      projectPrice: 3500,
      paymentStatus: 'Paid',
      expiryDate: '2025-01-25'
    },
    {
      id: 'w4',
      clientId: 'c7',
      domainName: 'desaitech.io',
      url: 'https://desaitech.io',
      hostingProvider: 'Vercel',
      platform: 'Custom',
      dateCreated: '2024-03-02',
      projectPrice: 5000,
      paymentStatus: 'Partial',
      expiryDate: '2025-03-02'
    }
  ],
  credentials: [
    {
      id: 'cr1',
      clientId: 'c1',
      type: 'WordPress Admin',
      username: 'admin',
      password: btoa('P@ssword123'),
      url: 'https://koficrafts.com/wp-admin'
    }
  ],
  tasks: [
    {
      id: 't1',
      clientId: 'c1',
      description: 'Review homepage',
      status: 'Pending',
      dueDate: '2024-05-01'
    },
    {
      id: 't2',
      clientId: 'c2',
      description: 'Set up Google Analytics',
      status: 'In Progress',
      dueDate: '2024-04-28'
    },
    {
      id: 't3',
      clientId: 'c10',
      description: 'Review Q1 Financials UI',
      status: 'Pending',
      dueDate: '2024-06-10'
    }
  ],
  reminders: [
    {
      id: 'r1',
      type: 'Domain',
      title: 'jenkinsbakery.com Domain Expiry',
      date: '2024-03-20',
      isRead: false
    },
    {
      id: 'r2',
      type: 'Payment',
      title: 'Desai Tech Final Installment',
      date: '2024-03-15',
      isRead: false
    }
  ]
};