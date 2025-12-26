import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { ForgotPasswordRequest } from "../types";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [formData, setFormData] = useState<ForgotPasswordRequest>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.details && Array.isArray(data.error.details)) {
          // Handle validation errors
          const errors: Record<string, string> = {};
          data.error.details.forEach((detail: { field: string; message: string }) => {
            errors[detail.field] = detail.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.error?.message || "Password reset request failed");
        }
        return;
      }

      // Success
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-600 mt-2">
            If an account with this email exists, you will receive a password reset link.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Didn't receive an email? Check your spam folder or try again.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(false);
              setFormData({ email: "" });
            }}
          >
            Send Another Email
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
        <p className="text-gray-600 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            className={validationErrors.email ? "border-red-300 focus:border-red-500" : ""}
            placeholder="Enter your email address"
          />
          {validationErrors.email && <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in here
        </a>
      </p>
    </div>
  );
}
