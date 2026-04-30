# Architecture

```bash
    ├── migrations
    ├── scripts
    │   └── run_postgres.sh
    ├── src
    │   ├── api
    │   │   ├── controllers
    │   │   │   └── ...  # controllers for the api
    │   │   ├── schemas
    │   │   │   └── ...  # Marshmallow schemas
    │   │   ├── middleware.py
    │   │   ├── responses.py
    │   │   └── requests.py
    │   ├── infrastructure
    │   │   ├── services
    │   │   │   └── ...  # Services that use third party libraries or services (e.g. email service)
    │   │   ├── databases
    │   │   │   └── ...  # Database adapaters and initialization
    │   │   ├── repositories
    │   │   │   └── ...  # Repositories for interacting with the databases
    │   │   └── models
    │   │   │   └── ...  # Database models
    │   ├── domain
    │   │   ├── constants.py
    │   │   ├── exceptions.py
    │   │   ├── models
    │   │   │   └── ...  # Business logic models
    │   ├── services
    │   │    └── ...  # Services for interacting with the domain (business logic)
    │   ├── app.py
    │   ├── config.py
    │   ├── cors.py
    │   ├── create_app.py
    │   ├── dependency_container.py
    │   ├── error_handler.py
    │   └── logging.py
```

## Domain Layer

## Services Layer

## Infrastructure Layer

## Chạy Backend (monorepo VELORA)

Backend nằm trong repo VELORA tại thư mục `Flask-CleanArchitecture/`.

```bash
python --version
cd Flask-CleanArchitecture
py -m venv .venv
.venv\Scripts\activate.ps1
pip install -r src/requirements.txt
cd src
python app.py
```

Trên Linux/macOS: `source .venv/bin/activate` thay cho bước kích hoạt `.ps1`.



Mặc định:
- API: `http://localhost:9999`
- Swagger UI: `http://localhost:9999/docs`
- Swagger JSON: `http://localhost:9999/swagger.json`

### Bootstrap admin đầu tiên (RBAC)

1. Đặt biến môi trường `BOOTSTRAP_TOKEN` (ví dụ trong `.env` hoặc shell trước khi chạy `app.py`).
2. Đăng ký user qua `POST /auth/register` với email hoặc phone và mật khẩu.
3. Gọi `POST /admin/rbac/bootstrap` kèm header `X-Bootstrap-Token: <giá trị BOOTSTRAP_TOKEN>` và body JSON:
   `{ "identifier": "<email hoặc phone vừa đăng ký>" }`.

Nếu không cấu hình `BOOTSTRAP_TOKEN`, API trả `bootstrap_disabled`.

### 4) Migration (Alembic)
Dự án có cơ chế auto-migrate khi app start (nếu cấu hình DB đầy đủ). Nếu muốn chạy thủ công:

```bash
cd src
python -m alembic -c alembic.ini upgrade head
```

Tạo migration mới (khi thay đổi ORM models):

```bash
cd src
python -m alembic -c alembic.ini revision --autogenerate -m "your message"
```



## Lưu ý về MSSQL (legacy)
Hệ thống chuẩn hóa dùng **PostgreSQL trên Supabase**. Phần MSSQL/Docker dưới đây là nội dung cũ (không dùng cho VELORA), có thể bỏ qua.

## ORM Flask (from sqlalchemy.orm )
Object Relational Mapping

Ánh xạ 1 class (OOP)  model src/infrastructure/models --> Table in database 
Ánh xạ các mối quan hệ (Relational) -- Khoá ngoại CSDL 
(n-n): many to many 

@startuml
' Diagram Title
title Clean Architecture Sequence Diagram

' Define participants in order of appearance
actor Actor
participant "Web App"
participant "Controller"
participant "Services"
participant "Domain"
participant "infrastructure"
database "Database"

' --- Message Flow ---

' 1. Initial Request
Actor -> "Web App": Request
activate "Web App"

' 2. Forwarding to Controller
"Web App" -> "Controller"
activate "Controller"

' 3. Calling the Service Layer
"Controller" -> "Services"
activate "Services"

' 4. Interacting with the Domain Layer
"Services" -> "Domain"
activate "Domain"
note over Domain: Interfaces

' 5. Interacting with Infrastructure
"Domain" -> "infrastructure"
activate "infrastructure"
note over infrastructure: Class implement

' 6. Database Query
"infrastructure" -> "Database"
activate "Database"

' --- Response Flow (Return Messages) ---

' 7. Database returns data
"Database" --> "infrastructure"
deactivate "Database"

' 8. Infrastructure returns to Domain
"infrastructure" --> "Domain"
deactivate "infrastructure"

' 9. Domain returns to Services
"Domain" --> "Services"
deactivate "Domain"

' 10. Services returns to Controller
"Services" --> "Controller"
deactivate "Services"

' 11. Controller returns to Web App
"Controller" --> "Web App"
deactivate "Controller"

' 12. Final data rendering to Actor
"Web App" --> Actor
note left of "Web App"
  Render data
end note
deactivate "Web App"

@enduml
