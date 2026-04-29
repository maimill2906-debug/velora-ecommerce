import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { contactSchema, type ContactFormData } from '../../lib/validations';

const faqs = [
  {
    question: 'Chính sách đổi trả của VELORA như thế nào?',
    answer:
      'VELORA chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua hàng đối với sản phẩm còn nguyên tem mác, chưa qua sử dụng. Vui lòng liên hệ bộ phận CSKH để được hỗ trợ thủ tục đổi trả.',
  },
  {
    question: 'VELORA có giao hàng trên toàn quốc không?',
    answer:
      'Có, VELORA giao hàng đến tất cả 63 tỉnh thành trên cả nước. Miễn phí vận chuyển cho đơn hàng từ 500.000₫. Thời gian giao hàng dự kiến 2-4 ngày làm việc.',
  },
  {
    question: 'Làm thế nào để tìm size phù hợp?',
    answer:
      'Mỗi sản phẩm đều có bảng hướng dẫn chọn size chi tiết. Nếu cần hỗ trợ thêm, hãy liên hệ CSKH qua hotline hoặc chat trực tuyến để được tư vấn trực tiếp.',
  },
  {
    question: 'VELORA có cửa hàng vật lý không?',
    answer:
      'Hiện tại VELORA có showroom tại Hà Nội và TP. Hồ Chí Minh. Bạn có thể đến thử sản phẩm trực tiếp trong giờ làm việc. Xem địa chỉ chi tiết ở dưới.',
  },
  {
    question: 'Có thể thanh toán bằng gì?',
    answer:
      'VELORA hỗ trợ nhiều hình thức thanh toán: COD (tiền mặt khi nhận hàng), chuyển khoản ngân hàng, ví MoMo, ZaloPay, và thẻ tín dụng/ghi nợ Visa/MasterCard.',
  },
  {
    question: 'Làm sao để theo dõi đơn hàng?',
    answer:
      'Sau khi đặt hàng, bạn sẽ nhận được mã đơn hàng qua email/SMS. Truy cập trang "Theo dõi đơn hàng" và nhập mã để kiểm tra trạng thái đơn hàng của bạn.',
  },
];

export function ContactPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onBlur', // Validate khi blur khỏi field
    reValidateMode: 'onChange', // Re-validate khi thay đổi sau khi có lỗi
  });

  const onSubmit = async (data: ContactFormData) => {
    console.log('Contact form:', data);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    toast.success('Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi trong vòng 24 giờ.');
    reset();
  };

  const contactInfo = [
    {
      icon: <Phone className="h-5 w-5" />,
      title: 'Hotline',
      lines: ['1900 xxxx', '(8:00 - 22:00, tất cả các ngày)'],
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'Email',
      lines: ['support@velora.vn', 'Phản hồi trong 24 giờ làm việc'],
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Showroom Hà Nội',
      lines: ['47 Tràng Tiền, Hoàn Kiếm', 'Hà Nội, Việt Nam'],
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Showroom TP.HCM',
      lines: ['98 Lê Lợi, Quận 1', 'TP. Hồ Chí Minh, Việt Nam'],
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Giờ mở cửa',
      lines: ['Thứ 2 - Thứ 6: 9:00 - 21:00', 'Thứ 7 - Chủ nhật: 9:00 - 22:00'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      {/* Hero */}
      <section className="velora-section border-b border-border text-center">
        <div className="velora-container">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Hỗ trợ</p>
          <h1
            className="mb-6 velora-heading"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem' }}
          >
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua bất kỳ kênh nào bên dưới hoặc để lại tin nhắn.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 border-b border-border">
        <div className="velora-container">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 border border-black flex items-center justify-center mx-auto mb-3">
                  {info.icon}
                </div>
                <h4 className="font-medium text-sm mb-2 uppercase tracking-wider">{info.title}</h4>
                {info.lines.map((line, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Social */}
      <section className="velora-section">
        <div className="velora-container">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="h-6 w-6" />
                <h2
                  className="velora-heading"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}
                >
                  Gửi tin nhắn
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Họ và tên *</Label>
                    <Input
                      id="name"
                      placeholder="Nguyễn Văn A"
                      {...register('name')}
                      className={`border-black ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 font-medium">⚠ {errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0912345678 (không bắt buộc)"
                      {...register('phone')}
                      className={`border-black ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {!errors.phone && (
                      <p className="text-xs text-muted-foreground">Tùy chọn</p>
                    )}
                    {errors.phone && (
                      <p className="text-sm text-red-500 font-medium">⚠ {errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    {...register('email')}
                    className={`border-black ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 font-medium">⚠ {errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Tiêu đề *</Label>
                  <Input
                    id="subject"
                    placeholder="Tiêu đề tin nhắn"
                    {...register('subject')}
                    className={`border-black ${errors.subject ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {!errors.subject && (
                    <p className="text-xs text-muted-foreground">5-100 ký tự</p>
                  )}
                  {errors.subject && (
                    <p className="text-sm text-red-500 font-medium">⚠ {errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Nội dung *</Label>
                  <textarea
                    id="message"
                    rows={6}
                    placeholder="Mô tả chi tiết vấn đề bạn cần hỗ trợ..."
                    {...register('message')}
                    className={`w-full border border-black p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {!errors.message && (
                    <p className="text-xs text-muted-foreground">10-1000 ký tự</p>
                  )}
                  {errors.message && (
                    <p className="text-sm text-red-500 font-medium">⚠ {errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white hover:bg-gray-800 h-14 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </Button>
              </form>
            </div>

            {/* Right: Additional Info */}
            <div>
              <h2
                className="mb-8 velora-heading"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem' }}
              >
                Kênh liên hệ khác
              </h2>

              <div className="space-y-8">
                {/* Social Media */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider mb-4">Mạng xã hội</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Facebook', handle: 'VELORA Fashion', url: '#' },
                      { name: 'Instagram', handle: '@velorafashion.vn', url: '#' },
                      { name: 'TikTok', handle: '@velora.fashion', url: '#' },
                      { name: 'Zalo OA', handle: 'VELORA Fashion', url: '#' },
                    ].map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        className="flex justify-between items-center py-3 border-b border-border hover:border-black transition-colors group"
                      >
                        <span className="text-sm font-medium">{social.name}</span>
                        <span className="text-sm text-muted-foreground group-hover:text-black">
                          {social.handle}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Kênh mua sắm */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider mb-4">Kênh mua sắm</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Website', handle: 'velora.vn' },
                      { name: 'Shopee', handle: 'Shopee VELORA Official' },
                      { name: 'TikTok Shop', handle: 'VELORA Fashion' },
                    ].map((channel) => (
                      <div
                        key={channel.name}
                        className="flex justify-between items-center py-3 border-b border-border"
                      >
                        <span className="text-sm font-medium">{channel.name}</span>
                        <span className="text-sm text-muted-foreground">{channel.handle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Response time */}
                <div className="bg-secondary p-6">
                  <h4 className="font-medium mb-3">Thời gian phản hồi</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chat Zalo / Facebook</span>
                      <span>15-30 phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotline</span>
                      <span>Ngay lập tức</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>Trong 24 giờ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Form liên hệ</span>
                      <span>Trong 24 giờ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="velora-section bg-secondary">
        <div className="velora-container max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Hỗ trợ</p>
            <h2
              className="velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
            >
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border last:border-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left py-6 flex justify-between items-center gap-4"
                >
                  <span className="font-medium">{faq.question}</span>
                  <span className="text-2xl flex-shrink-0 text-muted-foreground leading-none">
                    {expandedFaq === index ? '−' : '+'}
                  </span>
                </button>
                {expandedFaq === index && (
                  <div className="pb-6 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <VeloraFooterNew />
    </div>
  );
}
