import { z } from 'zod';

// Regex patterns
const vietnamesePhoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Helper function to validate Vietnamese phone
const isValidVietnamesePhone = (phone: string) => {
  const cleaned = phone.trim();
  if (!cleaned) return false;

  // Check format: starts with 0 or +84, followed by valid prefix and 8 digits
  if (cleaned.startsWith('0')) {
    return /^0(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
  }
  if (cleaned.startsWith('+84')) {
    return /^\+84(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
  }
  return false;
};

// Helper function to validate email
const isValidEmail = (email: string) => {
  const cleaned = email.trim().toLowerCase();
  return emailRegex.test(cleaned) && cleaned.length <= 254;
};

// Login validation
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .refine((val) => {
      const trimmed = val.trim();
      return isValidEmail(trimmed) || isValidVietnamesePhone(trimmed);
    }, 'Email hoặc số điện thoại không hợp lệ'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự'),
});

// Email login validation (chỉ chấp nhận email)
export const emailLoginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Email quá dài')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: user@example.com)'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự'),
});

// Phone login validation (chỉ chấp nhận số điện thoại)
export const phoneLoginSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .refine((val) => isValidVietnamesePhone(val), 'Số điện thoại không hợp lệ. Phải có 10 số bắt đầu bằng 0 (03, 05, 07, 08, 09)'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự'),
});

// Register validation
export const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự')
    .refine((val) => vietnameseNameRegex.test(val), 'Tên chỉ được chứa chữ cái và khoảng trắng')
    .refine((val) => !val.includes('  '), 'Tên không được chứa nhiều khoảng trắng liên tiếp'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Email quá dài')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ'),
  phone: z.string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .refine((val) => isValidVietnamesePhone(val), 'Số điện thoại không hợp lệ (phải có định dạng 0XXXXXXXXX hoặc +84XXXXXXXXX)'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự')
    .refine((val) => /[a-z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ thường (a-z)')
    .refine((val) => /[A-Z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)')
    .refine((val) => /\d/.test(val), 'Mật khẩu phải có ít nhất 1 chữ số (0-9)')
    .refine((val) => /^[a-zA-Z\d@$!%*?&]+$/.test(val), 'Mật khẩu chỉ được chứa chữ cái, số và ký tự đặc biệt (@$!%*?&)'),
  confirmPassword: z.string()
    .min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Contact form validation
export const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự')
    .refine((val) => vietnameseNameRegex.test(val), 'Tên chỉ được chứa chữ cái'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Email quá dài')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ'),
  phone: z.union([
    z.string().trim().length(0),
    z.string().trim().refine((val) => isValidVietnamesePhone(val), 'Số điện thoại không hợp lệ')
  ]).optional(),
  subject: z.string()
    .trim()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(100, 'Tiêu đề không được quá 100 ký tự')
    .refine((val) => val.trim().length >= 5, 'Tiêu đề không được chỉ chứa khoảng trắng'),
  message: z.string()
    .trim()
    .min(10, 'Nội dung phải có ít nhất 10 ký tự')
    .max(1000, 'Nội dung không được quá 1000 ký tự')
    .refine((val) => val.trim().length >= 10, 'Nội dung không được chỉ chứa khoảng trắng'),
});

// Checkout validation
export const checkoutSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được quá 50 ký tự')
    .refine((val) => vietnameseNameRegex.test(val), 'Họ tên chỉ được chứa chữ cái'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Email quá dài')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ'),
  phone: z.string()
    .trim()
    .min(1, 'Vui lòng nhập số điện thoại')
    .refine((val) => isValidVietnamesePhone(val), 'Số điện thoại không hợp lệ'),
  address: z.string()
    .trim()
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(200, 'Địa chỉ không được quá 200 ký tự')
    .refine((val) => val.trim().length >= 10, 'Địa chỉ không được chỉ chứa khoảng trắng'),
  city: z.string()
    .trim()
    .min(2, 'Vui lòng chọn Tỉnh/Thành phố'),
  district: z.string()
    .trim()
    .min(2, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string()
    .trim()
    .min(2, 'Vui lòng chọn Phường/Xã'),
  note: z.string()
    .trim()
    .max(500, 'Ghi chú không được quá 500 ký tự')
    .optional()
    .or(z.literal('')),
  paymentMethod: z.enum(['cod', 'bank', 'momo', 'vnpay', 'zalopay', 'card'], {
    required_error: 'Vui lòng chọn phương thức thanh toán',
  }),
});

// Profile update validation
export const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(50, 'Tên không được quá 50 ký tự')
    .refine((val) => vietnameseNameRegex.test(val), 'Tên chỉ được chứa chữ cái'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Email quá dài')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ'),
  phone: z.union([
    z.string().trim().length(0),
    z.string().trim().refine((val) => isValidVietnamesePhone(val), 'Số điện thoại không hợp lệ')
  ]).optional(),
  address: z.string()
    .trim()
    .max(200, 'Địa chỉ không được quá 200 ký tự')
    .optional()
    .or(z.literal('')),
});

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự')
    .refine((val) => /[a-z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ thường')
    .refine((val) => /[A-Z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .refine((val) => /\d/.test(val), 'Mật khẩu phải có ít nhất 1 chữ số')
    .refine((val) => /^[a-zA-Z\d@$!%*?&]+$/.test(val), 'Mật khẩu chỉ được chứa chữ cái, số và ký tự đặc biệt'),
  confirmPassword: z.string()
    .min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  path: ['newPassword'],
});

// Product validation (Admin)
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(3, 'Tên sản phẩm phải có ít nhất 3 ký tự')
    .max(100, 'Tên sản phẩm không được quá 100 ký tự')
    .refine((val) => val.trim().length >= 3, 'Tên sản phẩm không được chỉ chứa khoảng trắng'),
  description: z.string()
    .trim()
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(1000, 'Mô tả không được quá 1000 ký tự')
    .refine((val) => val.trim().length >= 10, 'Mô tả không được chỉ chứa khoảng trắng'),
  price: z.number({
    required_error: 'Vui lòng nhập giá sản phẩm',
    invalid_type_error: 'Giá phải là số',
  })
    .positive('Giá phải là số dương')
    .min(1000, 'Giá phải lớn hơn 1,000đ')
    .max(100000000, 'Giá không được quá 100,000,000đ')
    .finite('Giá không hợp lệ'),
  category: z.string()
    .trim()
    .min(1, 'Vui lòng chọn danh mục'),
  stock: z.number({
    required_error: 'Vui lòng nhập số lượng',
    invalid_type_error: 'Số lượng phải là số',
  })
    .int('Số lượng phải là số nguyên')
    .min(0, 'Số lượng không được âm')
    .max(999999, 'Số lượng không được quá 999,999')
    .finite('Số lượng không hợp lệ'),
  sku: z.string()
    .trim()
    .toUpperCase()
    .min(3, 'Mã SKU phải có ít nhất 3 ký tự')
    .max(50, 'Mã SKU không được quá 50 ký tự')
    .regex(/^[A-Z0-9-]+$/, 'Mã SKU chỉ được chứa chữ hoa, số và dấu gạch ngang'),
});

// Order tracking validation
export const orderTrackingSchema = z.object({
  orderId: z.string()
    .trim()
    .toUpperCase()
    .min(5, 'Mã đơn hàng phải có ít nhất 5 ký tự')
    .max(50, 'Mã đơn hàng không được quá 50 ký tự')
    .regex(/^[A-Z0-9-]+$/, 'Mã đơn hàng không hợp lệ'),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Vui lòng nhập email')
    .refine((val) => isValidEmail(val), 'Email không hợp lệ')
    .optional(),
});

// Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type EmailLoginFormData = z.infer<typeof emailLoginSchema>;
export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type OrderTrackingFormData = z.infer<typeof orderTrackingSchema>;
