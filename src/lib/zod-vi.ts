import { z } from 'zod';

// Custom error map cho Zod - Tiếng Việt
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') {
      return { message: 'Trường này là bắt buộc' };
    }
    if (issue.received === 'null') {
      return { message: 'Trường này không được để trống' };
    }
    if (issue.expected === 'string') {
      return { message: 'Vui lòng nhập văn bản' };
    }
    if (issue.expected === 'number') {
      return { message: 'Vui lòng nhập số' };
    }
    return { message: `Kiểu dữ liệu không hợp lệ. Cần ${issue.expected}, nhận được ${issue.received}` };
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === 'email') {
      return { message: 'Email không hợp lệ' };
    }
    if (issue.validation === 'url') {
      return { message: 'URL không hợp lệ' };
    }
    if (issue.validation === 'regex') {
      return { message: 'Định dạng không hợp lệ' };
    }
    return { message: 'Chuỗi không hợp lệ' };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      if (issue.minimum === 1) {
        return { message: 'Trường này là bắt buộc' };
      }
      return { message: `Phải có ít nhất ${issue.minimum} ký tự` };
    }
    if (issue.type === 'number') {
      return { message: `Phải lớn hơn hoặc bằng ${issue.minimum}` };
    }
    if (issue.type === 'array') {
      return { message: `Phải có ít nhất ${issue.minimum} phần tử` };
    }
    return { message: `Giá trị quá nhỏ` };
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return { message: `Không được quá ${issue.maximum} ký tự` };
    }
    if (issue.type === 'number') {
      return { message: `Không được lớn hơn ${issue.maximum}` };
    }
    if (issue.type === 'array') {
      return { message: `Không được có quá ${issue.maximum} phần tử` };
    }
    return { message: `Giá trị quá lớn` };
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return { message: `Giá trị không hợp lệ. Chọn một trong: ${issue.options.join(', ')}` };
  }

  if (issue.code === z.ZodIssueCode.invalid_date) {
    return { message: 'Ngày tháng không hợp lệ' };
  }

  if (issue.code === z.ZodIssueCode.custom) {
    return { message: issue.message || 'Dữ liệu không hợp lệ' };
  }

  if (issue.code === z.ZodIssueCode.invalid_literal) {
    return { message: `Giá trị không hợp lệ. Cần: ${JSON.stringify(issue.expected)}` };
  }

  if (issue.code === z.ZodIssueCode.unrecognized_keys) {
    return { message: `Các trường không được phép: ${issue.keys.join(', ')}` };
  }

  if (issue.code === z.ZodIssueCode.invalid_union) {
    return { message: 'Dữ liệu không khớp với bất kỳ định dạng nào được chấp nhận' };
  }

  if (issue.code === z.ZodIssueCode.invalid_union_discriminator) {
    return { message: `Giá trị phân biệt không hợp lệ. Cần: ${issue.options.join(', ')}` };
  }

  if (issue.code === z.ZodIssueCode.invalid_arguments) {
    return { message: 'Tham số hàm không hợp lệ' };
  }

  if (issue.code === z.ZodIssueCode.invalid_return_type) {
    return { message: 'Kiểu trả về không hợp lệ' };
  }

  if (issue.code === z.ZodIssueCode.not_multiple_of) {
    return { message: `Phải là bội số của ${issue.multipleOf}` };
  }

  if (issue.code === z.ZodIssueCode.not_finite) {
    return { message: 'Số phải là hữu hạn' };
  }

  // Default message
  return { message: ctx.defaultError };
};

// Set error map globally
z.setErrorMap(customErrorMap);

// Export function to initialize
export function initZodVietnamese() {
  // Error map already set above
}
