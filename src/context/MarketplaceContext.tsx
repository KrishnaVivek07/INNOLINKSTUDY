import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  MarketplaceProduct,
  CartItem,
  MarketplaceOrder,
  MarketplaceReview,
  SellerProfile,
  OrderStatus,
  ShippingAddress,
} from '../types';
import { useAuth } from './AuthContext';

interface MarketplaceContextType {
  products: MarketplaceProduct[];
  cartItems: CartItem[];
  orders: MarketplaceOrder[];
  reviews: MarketplaceReview[];
  sellerProfile: SellerProfile | null;
  
  // Cart Actions
  addToCart: (product: MarketplaceProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;

  // Checkout & Order Actions
  checkoutCart: (shippingAddress: ShippingAddress) => Promise<{ orderId: string; totalAmount: number; signature: string }>;
  confirmOrderPayment: (params: { orderId: string; amount: number; paymentId: string; signature: string; timestamp: number }) => Promise<MarketplaceOrder>;
  trackOrder: (orderId: string) => Promise<MarketplaceOrder | null>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  requestReturn: (orderId: string, reason?: string) => Promise<void>;

  // Seller Actions
  createProduct: (data: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) => Promise<MarketplaceProduct>;
  updateProduct: (productId: string, updates: Partial<MarketplaceProduct>) => Promise<void>;
  updateOrderStatusBySeller: (orderId: string, status: OrderStatus, trackingNumber?: string, carrierName?: string, note?: string) => Promise<void>;

  // Admin Actions
  approveProductByAdmin: (productId: string) => Promise<void>;
  rejectProductByAdmin: (productId: string) => Promise<void>;
  toggleProductActiveByAdmin: (productId: string, active: boolean) => Promise<void>;

  // Reviews
  addReview: (productId: string, rating: number, comment: string) => Promise<void>;
  canUserReview: (productId: string) => boolean;
}

const MarketplaceContext = createContext<MarketplaceContextType | null>(null);

const SEED_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'stem-kit-esp32-starter',
    sellerId: 'seller_innolink_official',
    sellerName: 'Innolink Official STEM Hardware',
    title: 'Innolink ESP32 IoT & Embedded Prototyping Starter Kit',
    description: 'Complete hands-on electronics laboratory kit designed specifically for Innolink Technologies embedded engineering curriculum. Includes NodeMCU ESP32, sensors, actuators, breadboards, and jumpers.',
    price: 39.99,
    discountPercent: 15,
    stock: 48,
    sku: 'INNO-KIT-ESP32-01',
    category: 'esp32',
    boardPlatform: 'esp32',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    componentsIncluded: [
      'ESP32 NodeMCU Wi-Fi + BLE Dev Board',
      '830-Point Solderless Breadboard',
      '16x2 I2C Character LCD Display',
      'SG90 9g Micro Servo Motor',
      'DHT11 Temperature & Humidity Sensor',
      'HC-SR04 Ultrasonic Distance Sensor',
      '10x LEDs (Red, Green, Blue, Amber)',
      '30x Carbon Film Resistors (220Ω, 1kΩ, 10kΩ)',
      '10kΩ Precision Potentiometer',
      '65x Male-to-Male Jumper Wires',
    ],
    specifications: {
      Microcontroller: 'Tensilica Xtensa Dual-Core 32-bit LX6',
      ClockSpeed: '240 MHz',
      OperatingVoltage: '3.3V (5V USB input)',
      Wireless: 'Wi-Fi 802.11 b/g/n + Bluetooth 4.2 BLE',
      FlashMemory: '4MB SPI Flash',
    },
    skillLevel: 'Beginner',
    recommendedAge: '12+ to Professional',
    warranty: '1 Year Manufacturer Replacement Warranty',
    shippingInfo: 'Dispatched within 24 hours. Express delivery available.',
    isApproved: true,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    rating: 4.9,
    reviewCount: 38,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stem-kit-arduino-robotics',
    sellerId: 'seller_innolink_official',
    sellerName: 'Innolink Official STEM Hardware',
    title: 'Innolink Arduino Uno Robotics & Autonomous Sensor Kit',
    description: 'Master hardware circuits and robotics actuation with this official ATmega328P Arduino kit. Features ultrasonic radar sensors, motor drivers, and high-torque geared motors.',
    price: 49.99,
    discountPercent: 10,
    stock: 35,
    sku: 'INNO-KIT-UNO-ROBO',
    category: 'robotics',
    boardPlatform: 'arduino',
    images: [
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    ],
    componentsIncluded: [
      'Arduino Uno R3 Microcontroller Board',
      'L298N Dual H-Bridge Motor Driver',
      '2x TT DC Gear Motors + Wheels',
      'HC-SR04 Ultrasonic Sensor + Servo Bracket',
      'Active & Passive Piezo Buzzers',
      'IR Obstacle Avoidance Modules',
      '9V Battery Clip & Power Harness',
    ],
    specifications: {
      Core: 'ATmega328P 8-bit AVR',
      OperatingVoltage: '5V',
      DigitalIO: '14 Pins (6 PWM outputs)',
      AnalogInputs: '6 Pins',
    },
    skillLevel: 'Intermediate',
    recommendedAge: '13+',
    warranty: '6 Months Warranty',
    shippingInfo: 'Standard 2-3 business day dispatch with tracking.',
    isApproved: true,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    rating: 4.8,
    reviewCount: 29,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stem-kit-pico-microcontroller',
    sellerId: 'seller_innolink_official',
    sellerName: 'Innolink Official STEM Hardware',
    title: 'Innolink Raspberry Pi Pico RP2040 Microcontroller Lab Kit',
    description: 'Explore dual-core ARM Cortex-M0+ processing with Raspberry Pi Pico. Optimized for MicroPython and C/C++ hardware coding with pre-soldered headers.',
    price: 29.99,
    discountPercent: 0,
    stock: 50,
    sku: 'INNO-KIT-PICO-01',
    category: 'pico',
    boardPlatform: 'rp2040_pico',
    images: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    ],
    componentsIncluded: [
      'Raspberry Pi Pico with Pre-soldered Headers',
      '0.96 inch I2C OLED Display Module',
      'RGB Tri-Color LED Light Bar',
      'Micro-USB High-Speed Cable',
      'Breadboard & Starter Sensors',
    ],
    specifications: {
      Processor: 'Dual-core ARM Cortex M0+ @ 133MHz',
      SRAM: '264KB on-chip',
      Flash: '2MB QSPI Flash',
    },
    skillLevel: 'Beginner',
    recommendedAge: '10+',
    warranty: '1 Year Warranty',
    shippingInfo: 'Free shipping on orders over $50.',
    isApproved: true,
    status: 'approved',
    relatedCourseId: 'course-electronics-core',
    rating: 4.9,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stem-kit-37-sensors',
    sellerId: 'seller_innolink_official',
    sellerName: 'Innolink Official STEM Hardware',
    title: 'Innolink 37-in-1 Sensor Modules & Prototyping Explorer Pack',
    description: 'Extensive universal sensor pack compatible with Arduino, ESP32, and Raspberry Pi Pico. Includes environmental sensors, relays, hall-effect, and IR receivers.',
    price: 24.99,
    discountPercent: 20,
    stock: 60,
    sku: 'INNO-KIT-37-SENSORS',
    category: 'sensors',
    boardPlatform: 'universal',
    images: [
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=800&q=80',
    ],
    componentsIncluded: [
      '37 Discrete Sensor Modules in Labeled Case',
      'Relay Module (5V 10A)',
      'Flame Sensor, Sound Detector, Tilt Sensor',
      'Rotary Encoder Module',
    ],
    specifications: {
      Compatibility: '5V & 3.3V Microcontrollers',
      Packaging: 'Durable Compartmentalized Case',
    },
    skillLevel: 'All Levels',
    recommendedAge: '12+',
    warranty: '6 Months Warranty',
    shippingInfo: 'In stock ready for immediate shipping.',
    isApproved: true,
    status: 'approved',
    rating: 4.7,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
  },
];

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  // Products State
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => {
    const saved = localStorage.getItem('innolink_marketplace_products');
    return saved ? JSON.parse(saved) : SEED_PRODUCTS;
  });

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('innolink_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  // Orders State
  const [orders, setOrders] = useState<MarketplaceOrder[]>(() => {
    const saved = localStorage.getItem('innolink_marketplace_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Reviews State
  const [reviews, setReviews] = useState<MarketplaceReview[]>(() => {
    const saved = localStorage.getItem('innolink_marketplace_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  // Seller Profile
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(() => {
    const saved = localStorage.getItem('innolink_seller_profile');
    if (saved) return JSON.parse(saved);
    if (role === 'admin' && currentUser) {
      return {
        id: `seller_${currentUser.uid}`,
        userId: currentUser.uid,
        businessName: `${currentUser.displayName} STEM Kits`,
        contactEmail: currentUser.email,
        phone: '+91 99665 95709',
        address: 'V Savaram, 2-75, Ramayalam Street',
        status: 'approved',
        totalSales: 14,
        revenue: 620.0,
        joinedAt: new Date().toISOString(),
      };
    }
    return null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('innolink_marketplace_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('innolink_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);
  useEffect(() => {
    localStorage.setItem('innolink_marketplace_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('innolink_marketplace_reviews', JSON.stringify(reviews));
  }, [reviews]);
  useEffect(() => {
    if (sellerProfile) {
      localStorage.setItem('innolink_seller_profile', JSON.stringify(sellerProfile));
    }
  }, [sellerProfile]);

  // Cart Calculations
  const cartSubtotal = cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const cartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Cart Operations
  const addToCart = (product: MarketplaceProduct, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { productId: product.id, product, quantity, addedAt: new Date().toISOString() }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Checkout Cart via Backend
  const checkoutCart = async (shippingAddress: ShippingAddress) => {
    if (cartItems.length === 0) throw new Error('Cart is empty.');
    if (!currentUser) throw new Error('Please sign in to proceed with checkout.');

    const payload = {
      buyerId: currentUser.uid,
      buyerName: currentUser.displayName || shippingAddress.fullName,
      buyerEmail: currentUser.email,
      buyerPhone: shippingAddress.phone,
      items: cartItems.map((c) => ({
        productId: c.productId,
        title: c.product.title,
        price: c.product.price,
        quantity: c.quantity,
        sellerId: c.product.sellerId,
        image: c.product.images[0],
      })),
      shippingAddress,
    };

    const res = await fetch('/api/marketplace/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initiate marketplace order.');
    }

    return {
      orderId: data.orderId,
      totalAmount: data.totalAmount,
      signature: data.signature,
    };
  };

  // Confirm Order Payment via Server HMAC Verification
  const confirmOrderPayment = async (params: {
    orderId: string;
    amount: number;
    paymentId: string;
    signature: string;
    timestamp: number;
  }) => {
    if (!currentUser) throw new Error('Authentication required.');

    const res = await fetch('/api/marketplace/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        buyerId: currentUser.uid,
        paymentStatus: 'success',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.verified) {
      throw new Error(data.error || 'Payment verification failed on the server.');
    }

    // Clear cart on successful purchase
    clearCart();

    // Fetch confirmed order details
    const orderDetailsRes = await fetch(`/api/marketplace/track-order/${params.orderId}`);
    if (orderDetailsRes.ok) {
      const orderData = await orderDetailsRes.json();
      setOrders((prev) => [orderData, ...prev.filter((o) => o.orderId !== params.orderId)]);
      return orderData;
    }

    throw new Error('Order verified but could not load tracking receipt.');
  };

  const trackOrder = async (orderId: string): Promise<MarketplaceOrder | null> => {
    try {
      const res = await fetch(`/api/marketplace/track-order/${orderId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback to state
    }
    return orders.find((o) => o.orderId === orderId) || null;
  };

  const cancelOrder = async (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: 'CANCELLED',
              statusHistory: [
                ...o.statusHistory,
                { status: 'CANCELLED', timestamp: new Date().toISOString(), note: reason || 'Order cancelled by buyer.' },
              ],
            }
          : o
      )
    );
  };

  const requestReturn = async (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: 'RETURN_REQUESTED',
              statusHistory: [
                ...o.statusHistory,
                { status: 'RETURN_REQUESTED', timestamp: new Date().toISOString(), note: reason || 'Return request initiated.' },
              ],
            }
          : o
      )
    );
  };

  // Seller Operations
  const createProduct = async (
    data: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'rating' | 'reviewCount'>
  ): Promise<MarketplaceProduct> => {
    const newProduct: MarketplaceProduct = {
      ...data,
      id: `prod_${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (productId: string, updates: Partial<MarketplaceProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
  };

  const updateOrderStatusBySeller = async (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    carrierName?: string,
    note?: string
  ) => {
    await fetch('/api/marketplace/update-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, orderStatus: status, trackingNumber, carrierName, note }),
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: status,
              trackingNumber: trackingNumber || o.trackingNumber,
              carrierName: carrierName || o.carrierName,
              statusHistory: [
                ...o.statusHistory,
                { status, timestamp: new Date().toISOString(), note: note || `Updated to ${status}` },
              ],
            }
          : o
      )
    );
  };

  // Admin Controls
  const approveProductByAdmin = async (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isApproved: true, status: 'approved' } : p))
    );
  };

  const rejectProductByAdmin = async (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isApproved: false, status: 'rejected' } : p))
    );
  };

  const toggleProductActiveByAdmin = async (productId: string, active: boolean) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, isApproved: active, status: active ? 'approved' : 'disabled' }
          : p
      )
    );
  };

  // Verified Purchaser Reviews
  const canUserReview = (productId: string): boolean => {
    if (!currentUser) return false;
    // Check if user has purchased this product and payment is confirmed
    return orders.some(
      (o) =>
        o.buyerId === currentUser.uid &&
        o.paymentStatus === 'PAID' &&
        o.items.some((it) => it.productId === productId)
    );
  };

  const addReview = async (productId: string, rating: number, comment: string) => {
    if (!currentUser) throw new Error('Please sign in to leave a review.');
    if (!canUserReview(productId)) {
      throw new Error('Only verified purchasers can submit a review for this STEM kit.');
    }

    const newReview: MarketplaceReview = {
      id: `rev_${Date.now()}`,
      productId,
      buyerId: currentUser.uid,
      buyerName: currentUser.displayName || 'Verified Student Purchaser',
      rating,
      comment,
      verifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);

    // Recalculate average rating
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const productReviews = [newReview, ...reviews.filter((r) => r.productId === productId)];
          const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
          return {
            ...p,
            rating: Math.round(avg * 10) / 10,
            reviewCount: productReviews.length,
          };
        }
        return p;
      })
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        cartItems,
        orders,
        reviews,
        sellerProfile,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartCount,
        checkoutCart,
        confirmOrderPayment,
        trackOrder,
        cancelOrder,
        requestReturn,
        createProduct,
        updateProduct,
        updateOrderStatusBySeller,
        approveProductByAdmin,
        rejectProductByAdmin,
        toggleProductActiveByAdmin,
        addReview,
        canUserReview,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
