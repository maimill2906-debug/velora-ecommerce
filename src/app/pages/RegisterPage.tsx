import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { VeloraLogo } from '../components/VeloraLogo';
import {
  emailRegisterSchema, type EmailRegisterFormData,
  phoneRegisterSchema, type PhoneRegisterFormData,
} from '../../lib/validations';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

export function RegisterPage() {
  const navigate = useNavigate();

  const emailForm = useForm<EmailRegisterFormData>({
    resolver: zodResolver(emailRegisterSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const phoneForm = useForm<PhoneRegisterFormData>({
    resolver: zodResolver(phoneRegisterSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onEmailSubmit = async (data: EmailRegisterFormData) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (e: any) {
      toast.error(e?.message || 'Đăng ký thất bại');
    }
  };

  const onPhoneSubmit = async (data: PhoneRegisterFormData) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.name,
          phone: data.phone,
          password: data.password,
        }),
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (e: any) {
      toast.error(e?.message || 'Đăng ký thất bại');
    }
  };

  const handleSocialRegister = (provider: string) => {
    console.log('Social register with:', provider);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      {/* Logo */}
      <VeloraLogo className="mb-8" />

      {/* Register Form */}
      <div className="w-full max-w-md">
        <h1 className="text-center mb-2 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
          Đăng Ký
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Tạo tài khoản VELORA mới
        </p>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Số điện thoại</TabsTrigger>
          </TabsList>

          {/* Email Registration */}
          <TabsContent value="email">
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...emailForm.register('name')}
                  className={`border-black focus:ring-black ${emailForm.formState.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!emailForm.formState.errors.name && (
                  <p className="text-xs text-muted-foreground">Chỉ chữ cái, 2-50 ký tự</p>
                )}
                {emailForm.formState.errors.name && (
                  <p className="text-sm text-red-500 font-medium">⚠ {emailForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...emailForm.register('email')}
                  className={`border-black focus:ring-black ${emailForm.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!emailForm.formState.errors.email && (
                  <p className="text-xs text-muted-foreground">Ví dụ: user@domain.com</p>
                )}
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500 font-medium">⚠ {emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  {...emailForm.register('password')}
                  className={`border-black focus:ring-black ${emailForm.formState.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!emailForm.formState.errors.password && (
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 8 ký tự, bao gồm chữ HOA, chữ thường và số
                  </p>
                )}
                {emailForm.formState.errors.password && (
                  <p className="text-sm text-red-500 font-medium">⚠ {emailForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...emailForm.register('confirmPassword')}
                  className={`border-black focus:ring-black ${emailForm.formState.errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {emailForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium">⚠ {emailForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 mt-6"
              >
                {emailForm.formState.isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
              </Button>
            </form>
          </TabsContent>

          {/* Phone Registration */}
          <TabsContent value="phone">
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-phone">Họ và tên *</Label>
                <Input
                  id="name-phone"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...phoneForm.register('name')}
                  className={`border-black focus:ring-black ${phoneForm.formState.errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!phoneForm.formState.errors.name && (
                  <p className="text-xs text-muted-foreground">Chỉ chữ cái, 2-50 ký tự</p>
                )}
                {phoneForm.formState.errors.name && (
                  <p className="text-sm text-red-500 font-medium">⚠ {phoneForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-tab">Số điện thoại *</Label>
                <Input
                  id="phone-tab"
                  type="tel"
                  placeholder="0912345678"
                  {...phoneForm.register('phone')}
                  className={`border-black focus:ring-black ${phoneForm.formState.errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!phoneForm.formState.errors.phone && (
                  <p className="text-xs text-muted-foreground">10 số, bắt đầu bằng 0 (03, 05, 07, 08, 09)</p>
                )}
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-500 font-medium">⚠ {phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-phone">Mật khẩu *</Label>
                <Input
                  id="password-phone"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  {...phoneForm.register('password')}
                  className={`border-black focus:ring-black ${phoneForm.formState.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!phoneForm.formState.errors.password && (
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 8 ký tự, bao gồm chữ HOA, chữ thường và số
                  </p>
                )}
                {phoneForm.formState.errors.password && (
                  <p className="text-sm text-red-500 font-medium">⚠ {phoneForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword-phone">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword-phone"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...phoneForm.register('confirmPassword')}
                  className={`border-black focus:ring-black ${phoneForm.formState.errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {phoneForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium">⚠ {phoneForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={phoneForm.formState.isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 mt-6"
              >
                {phoneForm.formState.isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">HOẶC</span>
          <Separator className="flex-1" />
        </div>

        {/* Social Register */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full border-black hover:bg-black hover:text-white h-12"
            onClick={() => handleSocialRegister('google')}
          >
            Đăng ký với Google
          </Button>
        </div>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium hover:underline text-black">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© 2025 VELORA FASHION. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  );
}
