import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { VeloraLogo } from '../components/VeloraLogo';
import { registerSchema, type RegisterFormData } from '../../lib/validations';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate khi blur khỏi field
    reValidateMode: 'onChange', // Re-validate khi thay đổi sau khi có lỗi
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: data.name,
          email: data.email,
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register('name')}
                  className={`border-black focus:ring-black ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.name && (
                  <p className="text-xs text-muted-foreground">Chỉ chữ cái, 2-50 ký tự</p>
                )}
                {errors.name && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  {...register('email')}
                  className={`border-black focus:ring-black ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.email && (
                  <p className="text-xs text-muted-foreground">Ví dụ: user@domain.com</p>
                )}
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  {...register('phone')}
                  className={`border-black focus:ring-black ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.phone && (
                  <p className="text-xs text-muted-foreground">10 số, bắt đầu bằng 0 (03, 05, 07, 08, 09)</p>
                )}
                {errors.phone && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  {...register('password')}
                  className={`border-black focus:ring-black ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.password && (
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 8 ký tự, bao gồm chữ HOA, chữ thường và số
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')}
                  className={`border-black focus:ring-black ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 mt-6"
              >
                {isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
              </Button>
            </form>
          </TabsContent>

          {/* Phone Registration */}
          <TabsContent value="phone">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-phone">Họ và tên *</Label>
                <Input
                  id="name-phone"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register('name')}
                  className={`border-black focus:ring-black ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.name && (
                  <p className="text-xs text-muted-foreground">Chỉ chữ cái, 2-50 ký tự</p>
                )}
                {errors.name && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-phone">Số điện thoại *</Label>
                <Input
                  id="phone-phone"
                  type="tel"
                  placeholder="0912345678"
                  {...register('phone')}
                  className={`border-black focus:ring-black ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.phone && (
                  <p className="text-xs text-muted-foreground">10 số, bắt đầu bằng 0 (03, 05, 07, 08, 09)</p>
                )}
                {errors.phone && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-phone">Email *</Label>
                <Input
                  id="email-phone"
                  type="email"
                  placeholder="example@email.com"
                  {...register('email')}
                  className={`border-black focus:ring-black ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.email && (
                  <p className="text-xs text-muted-foreground">Ví dụ: user@domain.com</p>
                )}
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-phone">Mật khẩu *</Label>
                <Input
                  id="password-phone"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  {...register('password')}
                  className={`border-black focus:ring-black ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {!errors.password && (
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu 8 ký tự, bao gồm chữ HOA, chữ thường và số
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword-phone">Xác nhận mật khẩu *</Label>
                <Input
                  id="confirmPassword-phone"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')}
                  className={`border-black focus:ring-black ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 font-medium">⚠ {errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 mt-6"
              >
                {isSubmitting ? 'Đang đăng ký...' : 'Đăng Ký'}
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
