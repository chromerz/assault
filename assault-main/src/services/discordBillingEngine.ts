import { DiscordCollectableItem, DiscordBillingPlan, DiscordPaymentMethod, DiscordGiftItem, DiscordInvoice, DiscordUser } from '../types';

export const INITIAL_COLLECTIBLES: DiscordCollectableItem[] = [
  {
    id: 'dec_sakura',
    name: 'Sakura Petal Halo',
    category: 'AVATAR_DECORATION',
    collection: 'Anime Blossoms',
    priceUSD: 4.99,
    nitroDiscountUSD: 3.99,
    orbsPrice: 450,
    previewUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=160&auto=format&fit=crop',
    assetUrl: '🌸',
    description: 'Delicate floating cherry blossom petals encircling your avatar with pink glow.',
    isPurchased: true,
    isEquipped: false,
    isInWishlist: false
  },
  {
    id: 'dec_cyber',
    name: 'Cybernetic Visor MK-IV',
    category: 'AVATAR_DECORATION',
    collection: 'Cyber City',
    priceUSD: 6.99,
    nitroDiscountUSD: 5.49,
    orbsPrice: 650,
    previewUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160&auto=format&fit=crop',
    assetUrl: '🥽',
    description: 'High-tech neon cyan ocular visor with targeting telemetry reticles.',
    isPurchased: false,
    isEquipped: false,
    isInWishlist: true
  },
  {
    id: 'dec_glitch',
    name: 'Disxcore Glitch Artifact',
    category: 'AVATAR_DECORATION',
    collection: 'Retro Cyber',
    priceUSD: 5.99,
    nitroDiscountUSD: 4.49,
    orbsPrice: 550,
    previewUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop',
    assetUrl: '⚡',
    description: 'RGB chromatic aberration distortion framing with scanline pulse.',
    isPurchased: true,
    isEquipped: true,
    isInWishlist: false
  },
  {
    id: 'dec_cat_ears',
    name: 'Pastel Neko Ears',
    category: 'AVATAR_DECORATION',
    collection: 'Cozy Cottage',
    priceUSD: 4.99,
    nitroDiscountUSD: 3.99,
    orbsPrice: 450,
    previewUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=160&auto=format&fit=crop',
    assetUrl: '🐱',
    description: 'Cute twitching kitten ears with pastel lavender bells.',
    isPurchased: false,
    isEquipped: false,
    isInWishlist: false
  },
  {
    id: 'dec_skull_flame',
    name: 'Infernal Skull Crown',
    category: 'AVATAR_DECORATION',
    collection: 'Underworld Relics',
    priceUSD: 7.99,
    nitroDiscountUSD: 5.99,
    orbsPrice: 800,
    previewUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=160&auto=format&fit=crop',
    assetUrl: '💀',
    description: 'Burning crimson flames bursting from obsidian bone horns.',
    isPurchased: false,
    isEquipped: false,
    isInWishlist: false
  },
  // Profile Effects
  {
    id: 'fx_lightning',
    name: 'Midnight Thunderstrike',
    category: 'PROFILE_EFFECT',
    collection: 'Elemental Forces',
    priceUSD: 9.99,
    nitroDiscountUSD: 7.99,
    orbsPrice: 1000,
    previewUrl: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=160&auto=format&fit=crop',
    assetUrl: '⚡',
    description: 'Violent purple electric lightning arcs crashing down your user profile banner.',
    isPurchased: true,
    isEquipped: true,
    isInWishlist: false
  },
  {
    id: 'fx_hyperdrive',
    name: 'Hyperspace Jump',
    category: 'PROFILE_EFFECT',
    collection: 'Deep Cosmos',
    priceUSD: 8.99,
    nitroDiscountUSD: 6.99,
    orbsPrice: 900,
    previewUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=160&auto=format&fit=crop',
    assetUrl: '🚀',
    description: 'Warp speed star streaks zooming across your bio card in perpetual motion.',
    isPurchased: false,
    isEquipped: false,
    isInWishlist: false
  },
  {
    id: 'fx_heartfall',
    name: '8-Bit Heart Shower',
    category: 'PROFILE_EFFECT',
    collection: 'Arcade Nostalgia',
    priceUSD: 7.99,
    nitroDiscountUSD: 5.99,
    orbsPrice: 750,
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=160&auto=format&fit=crop',
    assetUrl: '💖',
    description: 'Cascading glowing neon pixel hearts floating softly over your profile.',
    isPurchased: false,
    isEquipped: false,
    isInWishlist: true
  }
];

export const NITRO_PLANS: DiscordBillingPlan[] = [
  {
    id: 'plan_nitro_basic',
    name: 'Nitro Basic',
    tier: 'BASIC',
    price: '$2.99/month',
    interval: 'MONTHLY',
    features: [
      '50MB file sharing limit (up from 25MB)',
      'Custom emojis and stickers anywhere',
      'Special Nitro badge on your profile',
      'Unlimited Super Reactions with custom animations',
      'Custom client app icons and theme tints'
    ]
  },
  {
    id: 'plan_nitro_full',
    name: 'Nitro',
    tier: 'NITRO',
    price: '$9.99/month',
    interval: 'MONTHLY',
    features: [
      '500MB upload size for videos, code, and files',
      'HD 4K 60fps streaming & screen sharing',
      '2 Free Server Boosts + 30% off extra boosts',
      'Custom profile banner, animated avatar, and bio markdown',
      'Avatar Decorations and Profile Effects access',
      'Join up to 200 servers',
      'Custom Discord mobile app icons and themes',
      'Custom sounds across all servers'
    ]
  },
  {
    id: 'plan_nitro_annual',
    name: 'Nitro Annual',
    tier: 'ANNUAL',
    price: '$99.99/year (Save 16%)',
    interval: 'YEARLY',
    features: [
      'All Nitro perks included for a full year',
      '2 months free discount included',
      'Exclusive Early Supporter Nitro Badge ring',
      '2 Free Server Boosts refreshed each month',
      'Early access to experimental Discord beta features'
    ]
  }
];

export const INITIAL_PAYMENT_METHODS: DiscordPaymentMethod[] = [
  {
    id: 'pm_card_1',
    brand: 'VISA',
    last4: '4242',
    expiry: '12/28',
    isDefault: true
  },
  {
    id: 'pm_paypal',
    brand: 'PAYPAL',
    last4: 'user@paypal.me',
    expiry: 'N/A',
    isDefault: false
  },
  {
    id: 'pm_google_pay',
    brand: 'GOOGLE_PAY',
    last4: 'GPay Active',
    expiry: 'N/A',
    isDefault: false
  }
];

export const INITIAL_INVOICES: DiscordInvoice[] = [
  {
    id: 'inv_10921',
    invoiceNumber: 'DIS-2026-90412',
    date: 'Sep 26, 2026',
    description: 'Discord Nitro Monthly Subscription',
    amount: '$9.99',
    status: 'PAID',
    paymentMethod: 'Visa ending in 4242'
  },
  {
    id: 'inv_10819',
    invoiceNumber: 'DIS-2026-88192',
    date: 'Aug 26, 2026',
    description: 'Disxcore Glitch Artifact (Avatar Decoration)',
    amount: '$4.49',
    status: 'PAID',
    paymentMethod: 'Visa ending in 4242'
  },
  {
    id: 'inv_10702',
    invoiceNumber: 'DIS-2026-76501',
    date: 'Jul 26, 2026',
    description: 'Server Boost x2 (block party)',
    amount: '$6.99',
    status: 'PAID',
    paymentMethod: 'PayPal'
  }
];

export const INITIAL_GIFTS: DiscordGiftItem[] = [
  {
    id: 'gift_nitro_1',
    code: 'discord.gift/nitro-classic-84h29f',
    planName: 'Nitro (1 Month)',
    createdAt: Date.now() - 86400000 * 3,
    isClaimed: false,
    giftCardTheme: 'Cyberpunk Neon'
  }
];
