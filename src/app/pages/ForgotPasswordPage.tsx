import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';
import logoImg from '../../imports/image-1.png';

const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại'),
});

const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(10, 'Mã đặt lại không hợp lệ'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .max(128, 'Mật khẩu quá dài'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  });

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [resetToken, setResetToken] = useState('');
  const [identifier, setIdentifier] = useState('');

  const requestForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const requestReset = async (data: ForgotPasswordFormData) => {
    try {
      const res = await apiFetch<{ message: string; reset_token?: string; full_name?: string }>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: data.identifier }),
        }
      );
      setIdentifier(data.identifier);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        resetForm.setValue('token', res.reset_token);
        toast.success('Mã đặt lại đã được tạo. Hãy đặt mật khẩu mới bên dưới.');
        setStep('reset');
      } else {
        toast.success('Nếu email/SĐT tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
        setStep('reset');
      }
    } catch (e: any) {
      toast.error(`Có lỗi xảy ra: ${e?.message || ''}`);
    }
  };

  const submitReset = async (data: ResetPasswordFormData) => {
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: data.token, new_password: data.newPassword }),
      });
      setStep('done');
      toast.success('Đã đặt lại mật khẩu. Vui lòng đăng nhập lại.');
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg === 'invalid_or_expired_token') {
        toast.error('Mã đặt lại không hợp lệ hoặc đã hết hạn');
      } else if (msg === 'password_too_short') {
        toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      } else {
        toast.error(`Lỗi: ${msg}`);
      }
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="mb-12">
          <img src={logoImg} alt="VELORA" className="h-32 w-auto" />
        </div>
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
            Đặt lại mật khẩu thành công
          </h1>
          <p className="text-muted-foreground mb-8">
            Mật khẩu mới đã được lưu. Bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full bg-black text-white hover:bg-gray-800 h-12">
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-10">
      <div className="mb-12">
        <img src={logoImg} alt="VELORA - MINIMAL FASHION" className="h-32 w-auto" />
      </div>

      <div className="w-full max-w-md">
        <h1 className="text-center mb-2 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
          Quên mật khẩu?
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {step === 'request'
            ? 'Nhập email hoặc số điện thoại đã đăng ký để lấy mã đặt lại mật khẩu.'
            : 'Dán mã đặt lại bên dưới và đặt mật khẩu mới.'}
        </p>

        {step === 'request' && (
          <form onSubmit={requestForm.handleSubmit(requestReset)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email hoặc số điện thoại *</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="example@email.com hoặc 09xxxxxxxx"
                {...requestForm.register('identifier')}
                className={`border-black focus:ring-black ${requestForm.formState.errors.identifier ? 'border-red-500 focus:border-red-500' : ''}`}
                autoFocus
              />
              {requestForm.formState.errors.identifier && (
                <p className="text-sm text-red-500 font-medium">
                  ⚠ {requestForm.formState.errors.identifier.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={requestForm.formState.isSubmitting}
              className="w-full bg-black text-white hover:bg-gray-800 h-12"
            >
              {requestForm.formState.isSubmitting ? 'Đang gửi...' : 'Lấy mã đặt lại'}
            </Button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetForm.handleSubmit(submitReset)} className="space-y-6">
            {resetToken && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-xs text-yellow-900 break-all">
                <strong>Chế độ dev:</strong> Mã đặt lại đã được tạo cho{' '}
                <code className="bg-white px-1">{identifier}</code> và đã được điền vào ô bên dưới.
                Trong môi trường thật, mã này sẽ được gửi qua email/SMS thay vì trả thẳng về.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="token">Mã đặt lại *</Label>
              <Input
                id="token"
                type="text"
                placeholder="Dán mã reset_token..."
                {...resetForm.register('token')}
                className={`border-black ${resetForm.formState.errors.token ? 'border-red-500' : ''}`}
              />
              {resetForm.formState.errors.token && (
                <p className="text-sm text-red-500 font-medium">⚠ {resetForm.formState.errors.token.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                {...resetForm.register('newPassword')}
                className={`border-black ${resetForm.formState.errors.newPassword ? 'border-red-500' : ''}`}
              />
              {resetForm.formState.errors.newPassword && (
                <p className="text-sm text-red-500 font-medium">⚠ {resetForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...resetForm.register('confirmPassword')}
                className={`border-black ${resetForm.formState.errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 font-medium">
                  ⚠ {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-black h-12 flex-1"
                onClick={() => setStep('request')}
              >
                ← Quay lại
              </Button>
              <Button
                type="submit"
                disabled={resetForm.formState.isSubmitting}
                className="flex-1 bg-black text-white hover:bg-gray-800 h-12"
              >
                {resetForm.formState.isSubmitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center mt-8">
          <Link to="/login" className="text-sm hover:underline text-muted-foreground">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>© 2025 VELORA FASHION. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  );
}
