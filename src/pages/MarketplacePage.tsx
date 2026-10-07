import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { MarketplaceProduct, MarketplaceCategory, OrderStatus, ShippingAddress } from '../types';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Filter,
  Star,
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  X,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  Tag,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface MarketplacePageProps {
  onNavigateToCourse?: (courseId: string) => void;
  openAuthModal?: (mode: 'student_login' | 'admin_login' | 'register') => void;
  targetProductId?: string;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onNavigateToCourse,
  openAuthModal,
  targetProductId,
}) => {
  const { currentUser, role } = useAuth();
  const {
    products,
    cartItems,
    orders,
    reviews,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    cartCount,
    checkoutCart,
    confirmOrderPayment,
    canUserReview,
    addReview,
    createProduct,
    updateProduct,
    updateOrderStatusBySeller,
    approveProductByAdmin,
    rejectProductByAdmin,
    toggleProductActiveByAdmin,
  } = useMarketplace();

  // Navigation Subtabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'orders' | 'seller' | 'admin'>('catalog');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating'>('featured');

  // Modal View Product Details
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(() => {
    if (targetProductId) {
      return products.find((p) => p.id === targetProductId) || null;
    }
    return null;
  });

  // Review Form in Product Details
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '+91 99665 95709',
    addressLine: 'V Savaram, 2-75, Ramayalam Street',
    city: 'East Godavari',
    state: 'Andhra Pradesh',
    postalCode: '533261',
    country: 'India',
  });
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);

  // Seller Product Creation Modal
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('39.99');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdCategory, setNewProdCategory] = useState<MarketplaceCategory>('esp32');
  const [newProdComponents, setNewProdComponents] = useState('ESP32 Board, Breadboard, LEDs, Jumper Wires');

  // Filtered Products
  const filteredProducts = products
    .filter((p) => {
      // Must be approved for general catalog, or if admin/seller viewing their own
      if (role !== 'admin' && !p.isApproved && p.sellerId !== currentUser?.uid) {
        return false;
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedPlatform !== 'all' && p.boardPlatform !== selectedPlatform) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  // Handle Checkout submission
  const handleProceedCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setIsProcessingCheckout(true);

    try {
      // 1. Create order on backend
      const orderInit = await checkoutCart(shippingAddress);

      // 2. Simulate gateway authorization & verify on backend
      const paymentRef = `GATEWAY_PAY_${Date.now()}`;
      const confirmedOrder = await confirmOrderPayment({
        orderId: orderInit.orderId,
        amount: orderInit.totalAmount,
        paymentId: paymentRef,
        signature: orderInit.signature,
        timestamp: Date.now(),
      });

      setOrderConfirmation(confirmedOrder);
      setIsProcessingCheckout(false);
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
      setIsProcessingCheckout(false);
    }
  };

  // Handle Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await addReview(selectedProduct.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewNotice('Thank you! Your verified purchase review has been published.');
      setTimeout(() => setReviewNotice(null), 3000);
    } catch (err: any) {
      setReviewNotice(err.message || 'Failed to submit review.');
    }
  };

  // Seller Product Submission
  const handleSellerCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    await createProduct({
      sellerId: currentUser.uid,
      sellerName: currentUser.displayName || 'Faculty / Partner Seller',
      title: newProdTitle,
      description: newProdDesc,
      price: parseFloat(newProdPrice) || 29.99,
      discountPercent: 0,
      stock: parseInt(newProdStock, 10) || 10,
      sku: `INNO-${Date.now().toString().slice(-6)}`,
      category: newProdCategory,
      boardPlatform: newProdCategory === 'esp32' ? 'esp32' : newProdCategory === 'arduino' ? 'arduino' : 'universal',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'],
      componentsIncluded: newProdComponents.split(',').map((s) => s.trim()),
      specifications: { KitType: 'Hands-on Hardware', Voltage: '3.3V/5V' },
      skillLevel: 'Beginner',
      recommendedAge: '12+',
      warranty: '6 Months Warranty',
      shippingInfo: 'Standard 2-3 Day Shipping',
      isApproved: role === 'admin', // Auto-approved if admin, pending if seller
      status: role === 'admin' ? 'approved' : 'pending_approval',
    });

    setSellerModalOpen(false);
    setNewProdTitle('');
    setNewProdDesc('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-[var(--foreground)] transition-colors duration-200">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Official STEM Store
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
            STEM & Electronics Hardware Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-text)] mt-0.5">
            Original microcontrollers, robotics chassis, sensor packs, and prototyping kits designed for Innolink curricula.
          </p>
        </div>

        {/* Header Tabs: Catalog / Cart / Orders / Seller / Admin */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)] shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'catalog' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs' : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 relative ${
                activeTab === 'cart' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs' : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-secondary)] text-[var(--foreground)] font-bold text-[10px]">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs' : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Orders</span>
              {orders.length > 0 && (
                <span className="text-[10px] text-[var(--muted-text)] font-mono">({orders.length})</span>
              )}
            </button>
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs' : 'text-[var(--muted-text)] hover:text-[var(--foreground)]'
                }`}
              >
                <span>Admin Store Controls</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. CATALOG TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted-text)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ESP32, Arduino Uno, Raspberry Pi Pico, Robotics, Sensors..."
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-[var(--surface)]"
                />
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] rounded-lg px-3 py-2 focus:outline-none focus:border-slate-800 shadow-xs"
                >
                  <option value="all">All Microcontrollers</option>
                  <option value="esp32">ESP32 Compatible</option>
                  <option value="arduino">Arduino Uno</option>
                  <option value="rp2040_pico">Raspberry Pi Pico</option>
                  <option value="universal">Universal Components</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] rounded-lg px-3 py-2 focus:outline-none focus:border-slate-800 shadow-xs"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All STEM Kits' },
                { id: 'esp32', label: 'ESP32 Kits' },
                { id: 'arduino', label: 'Arduino Kits' },
                { id: 'pico', label: 'RP2040 Pico Kits' },
                { id: 'robotics', label: 'Robotics Chassis' },
                { id: 'sensors', label: 'Sensor Packs' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-3 py-1 rounded-lg shrink-0 transition cursor-pointer font-medium border ${
                    selectedCategory === c.id
                      ? 'bg-[var(--foreground)] text-[var(--background)] border-slate-900 font-semibold'
                      : 'bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)] border-[var(--border)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[var(--border)] transition"
              >
                <div>
                  {/* Product Image */}
                  <div
                    className="relative h-44 bg-[var(--surface-secondary)] overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProduct(prod)}
                  >
                    <img
                      src={prod.images[0]}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                    {prod.discountPercent && prod.discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-700 text-white font-semibold text-[10px]">
                        {prod.discountPercent}% OFF
                      </span>
                    )}
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 text-[var(--foreground)] border border-[var(--border)] font-mono text-[10px] uppercase font-bold">
                      {prod.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted-text)] font-mono text-[11px]">{prod.sku}</span>
                      <div className="flex items-center gap-1 text-[var(--foreground)] text-xs font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{prod.rating.toFixed(1)}</span>
                        <span className="text-[var(--muted-text)] font-normal">({prod.reviewCount})</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => setSelectedProduct(prod)}
                      className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--foreground)] transition cursor-pointer line-clamp-2"
                    >
                      {prod.title}
                    </h3>

                    <p className="text-xs text-[var(--muted-text)] line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-[var(--foreground)]">
                        ${prod.price.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {prod.stock > 0 ? `In Stock (${prod.stock} units)` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(prod)}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] text-[var(--foreground)] text-xs font-medium transition cursor-pointer shadow-xs"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(prod, 1)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. CART TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'cart' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
              <span>Shopping Cart ({cartCount} Items)</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              ← Continue Shopping
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <ShoppingCart className="w-10 h-10 text-[var(--muted-text)] mx-auto" />
              <p className="text-sm text-[var(--muted-text)]">Your STEM hardware cart is currently empty.</p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Browse STEM Kits Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((it) => (
                <div
                  key={it.productId}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product.images[0]}
                      alt={it.product.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-950"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{it.product.title}</h4>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5">
                        ${it.product.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                        className="p-1 rounded text-[var(--muted-text)] hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-white">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                        className="p-1 rounded text-[var(--muted-text)] hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-sm font-bold font-mono text-white min-w-[70px] text-right">
                      ${(it.product.price * it.quantity).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(it.productId)}
                      className="text-[var(--muted-text)] hover:text-rose-400 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Subtotal & Checkout Summary */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-3">
                <div className="flex justify-between text-xs text-[var(--muted-text)]">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--muted-text)]">
                  <span>Shipping (Free over $100)</span>
                  <span className="font-mono text-white">{cartSubtotal > 100 ? 'FREE' : '$9.99'}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--muted-text)]">
                  <span>Estimated Tax (5%)</span>
                  <span className="font-mono text-white">${(cartSubtotal * 0.05).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm sm:text-base font-bold text-white">
                  <span>Total Amount</span>
                  <span className="font-mono text-cyan-400">
                    ${(cartSubtotal + (cartSubtotal > 100 ? 0 : 9.99) + cartSubtotal * 0.05).toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      openAuthModal?.('student_login');
                      return;
                    }
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs sm:text-sm transition cursor-pointer shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Delivery & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MY ORDERS TAB (With Strict Tracking Pipeline) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'orders' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>My STEM Orders & Shipment Tracking</span>
            </h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Review live fulfillment updates, tracking numbers, and delivery confirmation for your STEM kits.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Package className="w-10 h-10 text-[var(--muted-text)] mx-auto" />
              <p className="text-sm text-[var(--muted-text)]">You haven't placed any STEM kit orders yet.</p>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Browse Hardware Store
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                    <div>
                      <span className="font-mono font-bold text-cyan-400 text-sm">{ord.orderId}</span>
                      <div className="text-[var(--muted-text)] text-[11px] mt-0.5">
                        Placed on {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                        ✓ {ord.paymentStatus}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold text-[11px] font-mono">
                        {ord.orderStatus}
                      </span>
                    </div>
                  </div>

                  {/* Purchased Items */}
                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-slate-200">
                          {it.quantity}x {it.title}
                        </span>
                        <span className="font-mono text-[var(--muted-text)]">
                          ${(it.price * it.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Modular Courier Pipeline Timeline */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] uppercase font-bold text-[var(--muted-text)] block tracking-wider">
                      Fulfillment & Courier Pipeline
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[
                        { title: 'Payment Confirmed', active: true },
                        { title: 'Packed & Processed', active: ord.orderStatus !== 'ORDER_PLACED' },
                        { title: 'Shipped (In Transit)', active: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(ord.orderStatus) },
                        { title: 'Delivered', active: ord.orderStatus === 'DELIVERED' },
                      ].map((st, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-center ${
                            st.active
                              ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 font-semibold'
                              : 'border-slate-800 bg-slate-900/40 text-[var(--muted-text)]'
                          }`}
                        >
                          <div className="text-[10px]">{st.title}</div>
                        </div>
                      ))}
                    </div>

                    {ord.trackingNumber && (
                      <div className="text-[11px] text-cyan-400 font-mono pt-1">
                        Carrier: {ord.carrierName || 'Standard STEM Logistics'} • Tracking #:{' '}
                        <strong>{ord.trackingNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. SELLER PORTAL TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'seller' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>Seller Management Portal</span>
              </h2>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Manage your hardware products, stock inventory, and process customer fulfillment orders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSellerModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add STEM Product</span>
            </button>
          </div>

          {/* Seller's Products Table */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">My Listed Hardware Products</h3>
            <div className="space-y-2">
              {products
                .filter((p) => p.sellerId === currentUser?.uid || role === 'admin')
                .map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{prod.title}</span>
                      <div className="text-[var(--muted-text)] text-[11px] font-mono mt-0.5">
                        ${prod.price.toFixed(2)} • Stock: {prod.stock} units • Status:{' '}
                        <strong className={prod.isApproved ? 'text-emerald-400' : 'text-amber-400'}>
                          {prod.status.toUpperCase()}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateProduct(prod.id, { stock: prod.stock + 5 })}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                      >
                        +5 Stock
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. ADMIN CONTROLS TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'admin' && role === 'admin' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Admin Marketplace Governance</span>
            </h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Approve products, moderate sellers, and monitor marketplace integrity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Approvals</h3>
            <div className="space-y-2">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{prod.title}</span>
                    <span className="text-[var(--muted-text)] ml-2">by {prod.sellerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {prod.isApproved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                        ✓ Approved
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => approveProductByAdmin(prod.id)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                      >
                        Approve Product
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleProductActiveByAdmin(prod.id, !prod.isApproved)}
                      className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 text-slate-300 text-xs"
                    >
                      {prod.isApproved ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PRODUCT DETAILS MODAL */}
      {/* ---------------------------------------------------- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl my-8 space-y-4">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 text-[var(--muted-text)] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.title}
                className="w-full h-56 rounded-xl object-cover bg-slate-950"
              />
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
                  {selectedProduct.category} • {selectedProduct.sku}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">{selectedProduct.title}</h2>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ${selectedProduct.price.toFixed(2)}
                </div>
                <p className="text-xs text-[var(--muted-text)] leading-relaxed">{selectedProduct.description}</p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(selectedProduct, 1);
                      setSelectedProduct(null);
                      setActiveTab('cart');
                    }}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart & Checkout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Course Link Badge */}
            {selectedProduct.relatedCourseId && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                <span>Recommended Kit for: Hardware & Electronics Engineering Curriculum</span>
                {onNavigateToCourse && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(null);
                      onNavigateToCourse(selectedProduct.relatedCourseId!);
                    }}
                    className="text-white underline font-semibold cursor-pointer"
                  >
                    View Course
                  </button>
                )}
              </div>
            )}

            {/* Components Included Checklist */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Components Included in Kit
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-300">
                {selectedProduct.componentsIncluded.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-300">
              <span className="font-bold text-white uppercase tracking-wider block">Specifications</span>
              {Object.entries(selectedProduct.specifications).map(([k, v]) => (
                <div key={k} className="flex justify-between font-mono text-[11px]">
                  <span className="text-[var(--muted-text)]">{k}:</span>
                  <span className="text-white">{v}</span>
                </div>
              ))}
            </div>

            {/* Verified Reviews Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider">
                  Verified Purchaser Reviews ({selectedProduct.reviewCount})
                </span>
                <span className="text-amber-400 font-bold">{selectedProduct.rating.toFixed(1)} ★</span>
              </div>

              {/* Review Input for Verified Purchasers */}
              {canUserReview(selectedProduct.id) ? (
                <form onSubmit={handleReviewSubmit} className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Write a Review (Verified Purchaser)</span>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-800 text-amber-400 text-xs rounded px-2 py-0.5"
                    >
                      <option value={5}>5 Stars ★★★★★</option>
                      <option value={4}>4 Stars ★★★★☆</option>
                      <option value={3}>3 Stars ★★★☆☆</option>
                      <option value={2}>2 Stars ★★☆☆☆</option>
                      <option value={1}>1 Star ★☆☆☆☆</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience building projects with this kit..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Submit Review
                  </button>
                  {reviewNotice && <p className="text-[11px] text-cyan-400">{reviewNotice}</p>}
                </form>
              ) : (
                <p className="text-[11px] text-[var(--muted-text)] italic">
                  * Note: Only students with verified purchases of this kit can leave product reviews.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CHECKOUT MODAL */}
      {/* ---------------------------------------------------- */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span>STEM Hardware Delivery Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="text-[var(--muted-text)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderConfirmation ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Order Confirmed!</h4>
                <p className="text-xs text-slate-300">
                  Order ID: <strong className="font-mono text-cyan-300">{orderConfirmation.orderId}</strong>
                </p>
                <p className="text-xs text-[var(--muted-text)]">
                  Payment verified and fulfillment started. You can track courier updates under "My Orders".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutModalOpen(false);
                    setOrderConfirmation(null);
                    setActiveTab('orders');
                  }}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs cursor-pointer"
                >
                  View My Orders
                </button>
              </div>
            ) : (
              <form onSubmit={handleProceedCheckout} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">PIN / Postal Code</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.addressLine}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {checkoutError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                    {checkoutError}
                  </p>
                )}

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs font-mono font-bold text-white">
                  <span>Payable Total:</span>
                  <span className="text-cyan-400">
                    ${(cartSubtotal + (cartSubtotal > 100 ? 0 : 9.99) + cartSubtotal * 0.05).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingCheckout}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {isProcessingCheckout ? 'Verifying Payment on Server...' : 'Confirm Payment & Order STEM Kit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SELLER ADD PRODUCT MODAL */}
      {/* ---------------------------------------------------- */}
      {sellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-white">List New STEM Hardware Kit</h3>
            <form onSubmit={handleSellerCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Kit Title</label>
                <input
                  type="text"
                  required
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="e.g. Innolink ESP32 Bluetooth Car Kit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  required
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="esp32">ESP32</option>
                    <option value="arduino">Arduino</option>
                    <option value="pico">Pico</option>
                    <option value="robotics">Robotics</option>
                    <option value="sensors">Sensors</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Components (comma-separated)</label>
                <input
                  type="text"
                  value={newProdComponents}
                  onChange={(e) => setNewProdComponents(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSellerModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Submit Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
