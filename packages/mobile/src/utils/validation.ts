export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string | undefined>;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | undefined;
}

export function validateField(
  value: string,
  rules: ValidationRules,
  fieldName: string,
): string | undefined {
  if (rules.required && !value.trim()) {
    return `${fieldName} is required`;
  }
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be at most ${rules.maxLength} characters`;
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    return `Invalid ${fieldName.toLowerCase()}`;
  }
  if (rules.custom) {
    return rules.custom(value);
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email address";
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return undefined;
}

export function validateUsername(username: string): string | undefined {
  if (!username.trim()) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be at most 20 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return "Username can only contain letters, numbers, and underscores";
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return undefined;
}

export function validatePrice(price: string): string | undefined {
  if (!price) return "Price is required";
  const num = parseFloat(price);
  if (isNaN(num)) return "Invalid price";
  if (num <= 0) return "Price must be greater than 0";
  if (num > 999999999) return "Price seems too high";
  return undefined;
}

export function validateInviteCode(code: string): string | undefined {
  if (code && code.length > 0 && code.length < 6) {
    return "Invalid invite code";
  }
  return undefined;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PHONE_REGEX = /^\+?[\d\s-]{10,15}$/;
