##### HƯỚNG DẪN
- HỆ THỐNG SỬ DỤNG HỆ QUẢN TRỊ PostgreSQL ĐƯỢC QUẢN LÝ TRÊN SUPABASE ( DÙNG MCP SUPABASE ), NẾU CHƯA CẤU HÌNH HƯỚNG DẪN KẾT NỐI VÀ BẮT BUỘC DÙNG MCP SUPABASE.
- HỆ THỐNG ĐÃ CÓ SẴN GIAO DIỆN ĐƯỢC TẠO TỪ FIGMA, YÊU CẦU KHI LẬP TRÌNH BÁM SÁT CÁC CHỨC NĂNG, TRƯỜNG THÔNG TIN HIỂN THỊ, LUỒNG HOẠT ĐỘNG CỦA FRONTEND.
- HỆ THỐNG SỬ DỤNG BACKEND VỚI KIẾN TRÚC CLEAN ARCHITECTURE VÀ ĐÃ XÂY DỰNG SẴN CẤU TRÚC THƯ MỤC, YÊU CẦU TRIỂN KHAI BÁM SÁT CẤU TRÚC THƯ MỤC.
- HỆ THỐNG SỬ DỤNG CODE FIRST THAY VÌ DATABASE FIRST NÊN CẦN BÁM SÁT CÁC ENTITY MODELS ĐỂ THỰC HIỆN ORM XUỐNG CƠ SỞ DỮ LIỆU.
- KHI TRIỂN KHAI VÀ CẦN CÀI CÁC THƯ VIỆN CẦN THIẾT HÃY BỔ SUNG VÀO requirements.txt VÀ BỔ SUNG HƯỚNG DẪN VÀO README.md.
- HỆ THỐNG TRIỂN KHAI THEO CHUẨN GIAO THỨC REST API.
- CHƯA TRIỂN KHAI CÁC EXTERNAL SERVICE NHƯ THANH TOÁN, DỊCH VỤ GIAO HÀNG, VẬN CHUYỂN.
- HỆ THỐNG PHẢI ĐƯỢC XÁC THỰC VÀ PHÂN QUYỀN CÁC CHỨC NĂNG MẠNH MẼ CHO CÁC TÁC NHÂN.
###### QUY TRÌNH TRIỂN KHAI
    BƯỚC 1: KIỂM TRA CODE BASE VÀ KIẾN TRÚC HỆ THỐNG ĐỂ PHÂN TÍCH VÀ ĐÁNH GIÁ.
    BƯỚC 2: KIỂM TRA CÁC MCP SUPABASE ĐỂ NẮM RÕ TÌNH HÌNH CƠ SỞ DỮ LIỆU, CẤU HÌNH DATABASE.
    BƯỚC 3: KIỂM TRA GIAO DIỆN (FRONTEND), THỰC HIỆN PHÂN TÍCH ĐÁNH GIÁ VÀ TRIỂN KHAI CÁC ENTITY MODELS VÀO PHẦN domain/models (BƯỚC NÀY QUAN TRỌNG CẦN THIẾT KẾ KĨ, CẦN MÔ HÌNH HÓA PHÂN TÍCH BÀI TOÁN VÀ CÁC ĐỐI TƯỢNG TRONG HỆ THỐNG), BẮT BUỘC CÓ ROLE, FUNCTION, USER.
    BƯỚC 5: YÊU CẦU TUI CHẠY CHƯƠNG TRÌNH BACKEND ĐỂ THỰC HIỆN MIGRATION XUỐNG CƠ SỞ DỮ LIỆU.
    BƯỚC 6: DÙNG MCP SUPABASE ĐỂ KIỂM TRA CƠ SỞ DỮ LIỆU.
    BƯỚC 7: DỰA VÀO CÁC ENTITY MODEL VÀ GIAO DIỆN ( FRONTEND ) TRIỂN KHAI, LẬP TRÌNH BACKEND TƯƠNG ỨNG THEO TỪNG MODULE.
    BƯỚC 8: THỰC HIỆN INTERACTION FRONTEND AND BACKEND 
###### KẾT NỐI TỚI HỆ THỐNG CỦA TÔI
## Install ORM
    npm install prisma --save-dev
## Configure ORM
    npx prisma init
## Install Agent Skills (Optional)
    # Connect to Supabase via connection pooling
    DATABASE_URL="postgresql://postgres.jowbspmuxlksjkdjrrjf:079206043460@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

    # Direct connection to the database. Used for migrations
    DIRECT_URL="postgresql://postgres.jowbspmuxlksjkdjrrjf:079206043460@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
###### Tác nhân hệ thống
## Tác nhân chính
| Actor | Mô tả|
|------ |------|
| Admin | Quản trị hệ thống |
| Sales | Nhân viên bán hàng |
| Warehouse | Nhân viên kho |
| Marketing | Nhân viên marketing |
## Tác nhân ngoài hệ thống
| Actor | Mô tả |
|------|------|
| Customer | Khách hàng |
| E-commerce Platform | Sàn thương mại điện tử |
| Payment Gateway | Cổng thanh toán |
| Delivery Service | Đơn vị vận chuyển |
| Supplier | Nhà cung cấp |
####### Bối cảnh
Hệ thống quản lý kinh doanh quần áo đa kênh VELORA được xây dựng nhằm hỗ trợ doanh nghiệp vận hành đồng bộ trên nhiều kênh bán hàng, bao gồm cửa hàng vật lý, website và các sàn thương mại điện tử. Hệ thống áp dụng mô hình phân quyền theo vai trò (Role-Based Access Control – RBAC), trong đó mỗi nhóm người dùng được cấp quyền truy cập tương ứng với chức năng nghiệp vụ cụ thể.

Đối với Admin (Quản trị viên), đây là nhóm có quyền cao nhất, chịu trách nhiệm quản lý toàn bộ hệ thống. Các chức năng bao gồm: quản lý sản phẩm với đầy đủ thao tác tạo, chỉnh sửa, xóa danh mục và sản phẩm, cũng như quản lý các biến thể như kích thước và màu sắc; quản lý tài khoản người dùng thông qua việc tạo mới, chỉnh sửa, phân quyền, khóa hoặc kích hoạt tài khoản và tìm kiếm thông tin; cấu hình hệ thống như thiết lập danh mục, quản lý chi nhánh, cấu hình thuế, phí và trạng thái đơn hàng; theo dõi và phân tích báo cáo bao gồm doanh thu, lợi nhuận, hiệu quả theo từng kênh và dashboard tổng quan; đồng thời thực hiện quản lý dữ liệu như tra cứu, chỉnh sửa, xuất dữ liệu và đảm bảo đồng bộ dữ liệu trong toàn hệ thống.

Nhóm Sales (Nhân viên bán hàng) chịu trách nhiệm trực tiếp trong việc xử lý đơn hàng và giao dịch với khách hàng. Các chức năng chính bao gồm: thực hiện bán hàng tại quầy thông qua hệ thống POS với các thao tác như quét mã sản phẩm, chọn biến thể, nhập số lượng, áp dụng mã giảm giá, ghi nhận thanh toán và in hóa đơn; xử lý đơn hàng online bằng cách xem danh sách đơn, xác nhận đơn và chuyển thông tin đến bộ phận kho; tra cứu tồn kho theo sản phẩm hoặc theo từng biến thể (size, màu); theo dõi trạng thái đơn hàng từ khi xác nhận đến khi giao thành công.

Nhóm Warehouse (Nhân viên kho) đảm nhiệm toàn bộ hoạt động liên quan đến quản lý hàng hóa và vận chuyển. Cụ thể, hệ thống hỗ trợ nhập kho thông qua việc tạo phiếu nhập, ghi nhận sản phẩm, số lượng, giá vốn và tự động cập nhật tồn kho; xuất kho dựa trên yêu cầu từ đơn hàng, đảm bảo cập nhật số lượng tồn chính xác; thực hiện đóng gói đơn hàng; tạo và in nhãn vận chuyển, bàn giao cho đơn vị giao hàng; đồng thời hỗ trợ kiểm kê định kỳ, so sánh tồn kho thực tế với hệ thống, điều chỉnh sai lệch và xử lý các trường hợp hàng lỗi hoặc hoàn trả.

Nhóm Marketing (Nhân viên marketing) tập trung vào các hoạt động thúc đẩy doanh thu và chăm sóc khách hàng. Hệ thống cung cấp các chức năng như tạo và quản lý chương trình khuyến mãi (voucher), thiết lập giá trị giảm, điều kiện áp dụng, thời gian hiệu lực và giới hạn số lượng sử dụng; quản lý hệ thống tích điểm thông qua việc cấu hình quy tắc tích lũy và quy đổi điểm; phân tích dữ liệu khách hàng bằng cách truy xuất thông tin, phân nhóm khách hàng theo hành vi mua sắm và xuất dữ liệu phục vụ các chiến dịch marketing.

Đối với Customer (Khách hàng), hệ thống cung cấp các chức năng phục vụ trải nghiệm mua sắm. Người dùng có thể đăng ký và đăng nhập tài khoản; tìm kiếm, lọc và xem chi tiết sản phẩm; thêm sản phẩm vào giỏ hàng, đặt hàng và lựa chọn địa chỉ giao hàng; thực hiện thanh toán thông qua nhiều phương thức như thanh toán khi nhận hàng (COD), ví điện tử hoặc chuyển khoản ngân hàng; theo dõi trạng thái đơn hàng và quá trình vận chuyển; đồng thời quản lý thông tin cá nhân, bao gồm lịch sử mua hàng và điểm tích lũy.

Ngoài ra, các hệ thống bên ngoài như sàn thương mại điện tử, cổng thanh toán, đơn vị vận chuyển và nhà cung cấp không có quyền truy cập trực tiếp vào hệ thống nội bộ mà chỉ tương tác thông qua các API. Các tương tác này bao gồm gửi và nhận dữ liệu đơn hàng, xử lý thanh toán, cập nhật trạng thái giao hàng và cung cấp thông tin nhập kho.

Việc phân chia rõ ràng chức năng theo từng vai trò giúp hệ thống đảm bảo tính bảo mật, tránh xung đột thao tác, đồng thời nâng cao hiệu quả vận hành trong môi trường kinh doanh đa kênh phức tạp.