import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  emailLoginSchema,
  phoneLoginSchema,
  type EmailLoginFormData,
  type PhoneLoginFormData
} from '../../lib/validations';
import { VeloraLogo } from '../components/VeloraLogo';
import { apiFetch, setAuthToken, setSessionUserType } from '@/lib/apiClient';
import { resolvePostLoginNavigate } from '@/lib/roleAccess';
import { toast } from 'sonner';

type LoginResponse = { token: string; user_type: string };

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';

  // Form cho Email login
  const emailForm = useForm<EmailLoginFormData>({
    resolver: zodResolver(emailLoginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Form cho Phone login
  const phoneForm = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onEmailSubmit = async (data: EmailLoginFormData) => {
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: data.email, password: data.password }),
      });
      setAuthToken(res.token);
      setSessionUserType(res.user_type ?? null);
      toast.success('Đăng nhập thành công!');
      navigate(resolvePostLoginNavigate(nextUrl, res.user_type));
    } catch (e: any) {
      toast.error(e?.message || 'Đăng nhập thất bại');
    }
  };

  const onPhoneSubmit = async (data: PhoneLoginFormData) => {
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: data.email, password: data.password }),
      });
      setAuthToken(res.token);
      setSessionUserType(res.user_type ?? null);
      toast.success('Đăng nhập thành công!');
      navigate(resolvePostLoginNavigate(nextUrl, res.user_type));
    } catch (e: any) {
      toast.error(e?.message || 'Đăng nhập thất bại');
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Logo */}
      <div className="mb-12">
        <VeloraLogo size="large" showSubtitle={false} />
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md">
        <h1 className="text-center mb-2 velora-heading" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
          Đăng Nhập
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Chào mừng trở lại với VELORA
        </p>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Số điện thoại</TabsTrigger>
          </TabsList>

          {/* Email Login */}
          <TabsContent value="email">
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
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
                  <p className="text-xs text-muted-foreground">
                    Ví dụ: user@example.com
                  </p>
                )}
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500 font-medium">
                    ⚠ {emailForm.formState.errors.email.message}
                  </p>
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
                    Tối thiểu 6 ký tự
                  </p>
                )}
                {emailForm.formState.errors.password && (
                  <p className="text-sm text-red-500 font-medium">
                    ⚠ {emailForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={emailForm.formState.isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailForm.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>
          </TabsContent>

          {/* Phone Login */}
          <TabsContent value="phone">
            <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  {...phoneForm.register('email')}
                  className={`border-black focus:ring-black ${phoneForm.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!phoneForm.formState.errors.email && (
                  <p className="text-xs text-muted-foreground">
                    10 số, bắt đầu bằng 0 (03, 05, 07, 08, 09)
                  </p>
                )}
                {phoneForm.formState.errors.email && (
                  <p className="text-sm text-red-500 font-medium">
                    ⚠ {phoneForm.formState.errors.email.message}
                  </p>
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
                    Tối thiểu 6 ký tự
                  </p>
                )}
                {phoneForm.formState.errors.password && (
                  <p className="text-sm text-red-500 font-medium">
                    ⚠ {phoneForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={phoneForm.formState.isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {phoneForm.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Register Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium hover:underline text-black">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>© 2025 VELORA FASHION. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  );
}
