import { VeloraNav } from '../components/VeloraNav';
import { VeloraFooterNew } from '../components/VeloraFooterNew';
import { Button } from '../components/ui/button';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';

const studioImg = 'https://images.unsplash.com/photo-1758297679746-622bf9e6a20e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVzaWduZXIlMjBzdHVkaW8lMjBtaW5pbWFsaXN0fGVufDF8fHx8MTc3NjM0MTY0NXww&ixlib=rb-4.1.0&q=80&w=1080';
const boutiqueImg = 'https://images.unsplash.com/photo-1630259841548-43ab1a05cf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG90aGluZyUyMGJvdXRpcXVlJTIwaW50ZXJpb3IlMjBtaW5pbWFsaXN0JTIwYmxhY2slMjB3aGl0ZXxlbnwxfHx8fDE3NjM0MTY0NnwA&ixlib=rb-4.1.0&q=80&w=1080';
const teamImg = 'https://images.unsplash.com/photo-1632923943930-d2f53d09313a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwdGVhbSUyMHdvcmtpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzc2MzQxNjQ2fDA&ixlib=rb-4.1.0&q=80&w=1080';
const portraitImg = 'https://images.unsplash.com/photo-1776064352283-7eb46ae78f9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwd29tYW4lMjBmYXNoaW9uJTIwcG9ydHJhaXQlMjBlbGVnYW50fGVufDF8fHx8MTc3NjM0MTY1MHww&ixlib=rb-4.1.0&q=80&w=1080';

export function AboutPage() {
  const values = [
    {
      title: 'Thiết kế vượt thời gian',
      description:
        'Chúng tôi tạo ra những thiết kế vượt qua xu hướng nhất thời, tập trung vào phong cách bền vững và đường cắt cổ điển phù hợp qua từng mùa.',
    },
    {
      title: 'Chất lượng thủ công',
      description:
        'Mỗi sản phẩm được may với sự tỉ mỉ trong từng chi tiết, sử dụng chất liệu cao cấp nhất và kết hợp với bàn tay của những nghệ nhân lành nghề.',
    },
    {
      title: 'Thời trang bền vững',
      description:
        'Chúng tôi tin rằng xa xỉ và trách nhiệm đi đôi với nhau. Cam kết về tính bền vững được đan xen trong mọi khía cạnh thương hiệu.',
    },
  ];

  const milestones = [
    { year: '2025', title: 'Thành lập VELORA FASHION', desc: 'Ra mắt bộ sưu tập đầu tiên với 30 mẫu thiết kế tối giản tại Hà Nội.' },
    { year: '2025', title: 'Mở rộng kênh online', desc: 'Triển khai hệ thống bán hàng đa kênh: Website, Shopee, TikTok Shop.' },
    { year: '2026', title: 'Cửa hàng flagship đầu tiên', desc: 'Khai trương showroom VELORA tại trung tâm TP. Hồ Chí Minh.' },
    { year: '2026', title: 'Bộ sưu tập Cashmere Capsule', desc: 'Ra mắt dòng sản phẩm cao cấp Cashmere, nhận được sự đón nhận từ cộng đồng thời trang.' },
  ];

  const team = [
    { name: 'Nguyễn Minh Châu', role: 'Giám đốc sáng tạo', img: portraitImg },
    { name: 'Trần Thanh Hà', role: 'Trưởng bộ phận thiết kế', img: studioImg },
    { name: 'Lê Hoàng Nam', role: 'Giám đốc vận hành', img: teamImg },
    { name: 'Phạm Thị Thu', role: 'Giám đốc thương hiệu', img: boutiqueImg },
  ];

  return (
    <div className="min-h-screen bg-white">
      <VeloraNav />

      {/* Hero Section */}
      <section
        className="relative h-[70vh] min-h-[500px] overflow-hidden flex items-center justify-center"
        style={{
          backgroundImage: `url(${boutiqueImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'none',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${boutiqueImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-xs uppercase tracking-[0.4em] mb-4 opacity-80">Câu chuyện của chúng tôi</p>
          <h1
            className="velora-heading mb-6"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            Về VELORA FASHION
          </h1>
          <p className="text-lg max-w-2xl mx-auto opacity-90 leading-relaxed">
            Thương hiệu thời trang cao cấp với triết lý tối giản, tạo ra những thiết kế vượt thời gian cho người hiện đại Việt Nam.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="velora-section">
        <div className="velora-container">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Triết lý</p>
              <h2
                className="mb-8 velora-heading"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
              >
                Vẻ đẹp của sự tối giản
              </h2>
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  VELORA ra đời từ một tầm nhìn đơn giản: tạo ra thời trang nói lên điều gì đó qua sự yên lặng. Trong một thế giới ồn ào và thái quá, chúng tôi tìm thấy tiếng nói của mình trong sự đơn giản.
                </p>
                <p>
                  Mỗi sản phẩm trong bộ sưu tập là minh chứng cho triết lý này. Chúng tôi tin rằng sự thanh lịch thật sự không cần trang trí, chất lượng nói nhiều hơn số lượng, và thiết kế vượt thời gian là xa xỉ phẩm thực sự.
                </p>
                <p>
                  Cam kết của chúng tôi vượt ra ngoài thẩm mỹ. Chúng tôi hợp tác với những nghệ nhân có cùng giá trị, sử dụng chất liệu tôn trọng cả nghề thủ công lẫn môi trường.
                </p>
              </div>
            </div>
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={studioImg}
                alt="VELORA Studio"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="velora-section bg-secondary">
        <div className="velora-container">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Giá trị cốt lõi</p>
            <h2
              className="velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
            >
              Những gì chúng tôi tin tưởng
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-px bg-black mx-auto mb-8" />
                <h3
                  className="mb-4 velora-heading"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}
                >
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="velora-section">
        <div className="velora-container max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Hành trình</p>
            <h2
              className="velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
            >
              Lịch sử VELORA
            </h2>
          </div>
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-8">
                <div className="flex-shrink-0 w-16 text-right">
                  <span
                    className="velora-heading text-muted-foreground"
                    style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}
                  >
                    {milestone.year}
                  </span>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-3 h-3 bg-black rounded-full mt-1.5" />
                  {index < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h4 className="font-medium mb-2">{milestone.title}</h4>
                  <p className="text-sm text-muted-foreground">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="velora-section bg-secondary">
        <div className="velora-container">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Con người</p>
            <h2
              className="velora-heading"
              style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
            >
              Đội ngũ VELORA
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="group">
                <div className="aspect-[3/4] mb-4 overflow-hidden bg-gray-200">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <h4 className="font-medium mb-1">{member.name}</h4>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-b border-black">
        <div className="velora-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '2025', label: 'Năm thành lập' },
              { number: '500+', label: 'Sản phẩm' },
              { number: '10.000+', label: 'Khách hàng' },
              { number: '3', label: 'Kênh bán hàng' },
            ].map((stat, index) => (
              <div key={index}>
                <p
                  className="velora-heading mb-2"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}
                >
                  {stat.number}
                </p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="velora-section">
        <div className="velora-container max-w-2xl text-center">
          <h2
            className="mb-6 velora-heading"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem' }}
          >
            Khám phá VELORA
          </h2>
          <p className="text-muted-foreground mb-8">
            Trải nghiệm bộ sưu tập thời trang tối giản cao cấp của chúng tôi
          </p>
          <Button asChild className="bg-black text-white hover:bg-gray-800 h-14 px-12">
            <Link to="/shop">
              Xem bộ sưu tập
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <VeloraFooterNew />
    </div>
  );
}
