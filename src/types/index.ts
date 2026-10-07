export type UserRole = 'student' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  photoURL?: string;
  isOwner?: boolean;
}

export interface Course {
  id: string;
  mentorId: string;
  mentorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration: string;
  learningOutcomes: string[];
  coverImage?: string;
  isPublished: boolean;
  syllabus?: string[];
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description?: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  videoDuration?: number; // in seconds
  order: number;
  isPublished: boolean;
  notes?: string;
  pdfUrl?: string;
  resources?: { name: string; url: string }[];
  createdAt: string;
}

export interface AISummary {
  id: string;
  lessonId: string;
  courseId: string;
  summary: string;
  keyConcepts: string[];
  importantPoints: string[];
  studyQuestions: string[];
  draftQuizQuestions?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
  }[];
  status: 'draft' | 'published';
  updatedAt: string;
}

export type RegistrationApprovalStatus = 'PENDING_MENTOR_APPROVAL' | 'MENTOR_APPROVED' | 'REJECTED';

export interface Enrollment {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName?: string;
  courseId: string;
  courseTitle?: string;
  mentorId?: string;
  registrationStatus?: RegistrationApprovalStatus;
  mentorApprovalStatus?: RegistrationApprovalStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  paymentId?: string;
  transactionId?: string;
  amountINR?: number;
  couponId?: string;
  couponCode?: string;
  couponDiscount?: number;
  courseKey?: string;
  accessStatus?: 'LOCKED' | 'ACTIVE' | 'EXPIRED';
  enrolledAt: string;
  approvedAt?: string;
  paidAt?: string;
  activatedAt?: string;
  accessKeyUsed?: string;
  status: 'active' | 'pending' | 'completed' | 'rejected';
}

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_INR';
export type CouponStatus = 'active' | 'assigned' | 'redeemed' | 'expired';

export interface Coupon {
  id: string;
  couponCode: string;
  courseId?: string;
  courseTitle?: string;
  studentId?: string;
  studentEmail?: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 25 for 25% or 500 for ₹500
  currency: 'INR';
  status: CouponStatus;
  assignedBy?: string;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string;
}

export interface CourseAccessKey {
  id: string;
  key: string;
  courseId: string;
  studentId?: string;
  studentEmail?: string;
  mentorId?: string;
  isUsed: boolean;
  status: 'ACTIVE' | 'REDEEMED' | 'REVOKED' | 'EXPIRED';
  orderId?: string;
  paymentId?: string;
  usedBy?: string;
  createdAt: string;
  redeemedAt?: string;
  expiresAt?: string;
}

export type PaymentStatus = 'CREATED' | 'VERIFIED' | 'FAILED' | 'REJECTED';
export type PaymentEmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentEmail: string;
  studentName?: string;
  courseId: string;
  courseTitle?: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verifiedAt?: string;
  emailStatus: PaymentEmailStatus;
  courseKey?: string;
  createdAt: string;
  lastResentAt?: string;
}

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'multiple_select'
  | 'fill_in_blank'
  | 'code_based'
  | 'numerical';

export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  points?: number;
  codeSnippet?: string;
  imageUrl?: string;
}

export interface Test {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  mentorId: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  passingScore: number; // e.g. 70%
  isPublished: boolean;
  questions: TestQuestion[];
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string | number>;
  completedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  mentorId: string;
  title: string;
  description: string;
  maxMarks: number;
  dueDate?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  content: string;
  submissionType?: 'text' | 'image' | 'pdf' | 'circuit_file';
  fileUrl?: string;
  marks?: number;
  feedback?: string;
  status: 'submitted' | 'reviewed';
  submittedAt: string;
  reviewedAt?: string;
}

export interface CourseProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessons: string[];
  completedTests: string[];
  completedAssignments: string[];
  watchedPercentages?: Record<string, number>;
  percentage: number;
  isCompleted: boolean;
  completedAt?: string;
  certificateId?: string;
  lastAccessedAt: string;
}

export type AppTheme = 'dark' | 'light' | 'system';

export type StudentAuthStatus = 'pending_mentor_approval' | 'authorized' | 'rejected' | 'suspended';

export interface AuthorizedStudent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  courseId?: string;
  courseTitle?: string;
  hasPaid: boolean;
  paymentRef?: string;
  status: StudentAuthStatus;
  courseKey?: string; // The unique course key given to the student to study the course
  otpCode?: string; // One-time security authorization code if applicable
  registeredAt: string;
  authorizedAt?: string;
  authorizedByMentor?: string;
  lastLoginAt?: string;
}

export interface WorkspaceDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

export interface WorkspaceGmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  sender: string;
  subject: string;
  date: string;
  unread: boolean;
}

export interface WorkspaceMeetSession {
  id: string;
  name: string;
  meetingUri: string;
  meetingCode: string;
  topic: string;
  mentorName: string;
  scheduledTime?: string;
  createdAt: string;
}

// ==========================================
// CODING & HARDWARE LAB TYPES
// ==========================================
export type HardwareBoard = 'arduino_uno' | 'esp32' | 'rp2040_pico' | 'raspberry_pi';
export type CodingLabLanguage = 'arduino_c' | 'micropython' | 'python' | 'c_cpp' | 'blocks' | 'hybrid';

export interface SimulatedComponent {
  id: string;
  type:
    | 'esp32'
    | 'arduino_uno'
    | 'rp2040_pico'
    | 'raspberry_pi'
    | 'led'
    | 'rgb_led'
    | 'resistor'
    | 'push_button'
    | 'potentiometer'
    | 'buzzer'
    | 'servo'
    | 'ultrasonic_sensor'
    | 'ldr'
    | 'dht_sensor'
    | 'lcd_16x2'
    | 'oled_i2c'
    | 'dc_motor';
  label: string;
  color?: string;
  state?: {
    pin?: number | string;
    value?: number | string | boolean;
    digitalValue?: boolean;
    analogValue?: number;
    angle?: number;
    text?: string;
    temperature?: number;
    humidity?: number;
    distance?: number;
  };
  pins: Record<string, string>; // pinName -> boardPin
}

export interface CodingLab {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  mentorId?: string;
  title: string;
  description: string;
  board: HardwareBoard;
  language: CodingLabLanguage;
  requiredComponents: string[];
  recommendedKitId?: string; // Link to STEM Marketplace product
  startingCode?: string;
  startingBlocks?: string;
  instructions: string;
  expectedOutput: string;
  marks: number;
  attemptsAllowed: number;
  timeLimitMinutes?: number;
  dueDate?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface CodingProject {
  id: string;
  studentId: string;
  studentName?: string;
  labId?: string;
  courseId: string;
  title: string;
  board: HardwareBoard;
  language: CodingLabLanguage;
  code: string;
  blocksXmlOrJson?: string;
  components: SimulatedComponent[];
  isSubmitted?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface LabSubmission {
  id: string;
  labId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  board: HardwareBoard;
  code: string;
  blocksData?: string;
  simulationLog?: string;
  status: 'submitted' | 'reviewed' | 'passed' | 'needs_revision';
  marks?: number;
  feedback?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// ==========================================
// STEM MARKETPLACE TYPES
// ==========================================
export type MarketplaceCategory =
  | 'all'
  | 'arduino'
  | 'esp32'
  | 'pico'
  | 'robotics'
  | 'stem_kits'
  | 'electronics'
  | 'sensors'
  | 'diy_kits';

export interface MarketplaceProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  discountPercent?: number;
  stock: number;
  sku: string;
  category: MarketplaceCategory;
  boardPlatform?: 'arduino' | 'esp32' | 'rp2040_pico' | 'universal' | 'robotics';
  images: string[];
  componentsIncluded: string[];
  specifications: Record<string, string>;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  recommendedAge: string;
  warranty: string;
  shippingInfo: string;
  isApproved: boolean;
  status: 'pending_approval' | 'approved' | 'rejected' | 'disabled';
  relatedCourseId?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: MarketplaceProduct;
  quantity: number;
  addedAt: string;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  sellerId: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface MarketplaceOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentId?: string;
  orderStatus: OrderStatus;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  carrierName?: string;
  statusHistory: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceReview {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number; // 1 to 5
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  contactEmail: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'suspended';
  totalSales: number;
  revenue: number;
  joinedAt: string;
}

export interface TermsAndConditions {
  id?: string;
  content: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  published: boolean;
  publishedAt?: string;
}

export interface TermsAcceptance {
  userId: string;
  termsVersion: number;
  acceptedAt: string;
}

