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

## Chạy Backend
BƯỚC 1: Tạo file môi trường ảo Flask-CleanArchitecture/src/.env
  # Database (Supabase Session pooler - port 5432)
  DATABASE_URI=postgresql://postgres.jowbspmuxlksjkdjrrjf:tQMher1CNR8brLxb@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

  # Bootstrap admin lần đầu — xoá biến này sau khi setup admin xong
  BOOTSTRAP_TOKEN=Bina0608_bootstrap_token

  # Forgot password trả token thẳng về UI khi dev (production phải tắt)
  DEV_EXPOSE_RESET_TOKEN=1

  # Kho mặc định để auto-trừ stock khi đặt hàng.
  # Để trống = hệ thống tự lấy location đầu tiên. Bỏ qua nếu bạn chỉ có 1 kho.
  # DEFAULT_INVENTORY_LOCATION_CODE=KHO_HCM
BƯỚC 2: Tạo môi trường ảo
  py -m venv .venv
BƯỚC 3: Kích hoạt môi trường ảo
  .venv\Scripts\Activate.ps1
BƯỚC 4: Duy chuyển vào thư mục Flask-CleanArchitecture/src
  cd Flask-CleanArchitecture/src
BƯỚC 5: Cài đặt thư viện cần thiết
  pip install -r requirements.txt
BƯỚC 6: Chạy chương trình
  python app.py

## Chạy Frontend
BƯỚC 1: Duy chuyển đến thư mục frontend
  cd D:\velora-ecommerce
BƯỚC 2: Tải các gói cần thiếtthiết
  npm install
BƯỚC 4: Chạy chương trình
  npm run dev
BƯỚC 5: KIỂM TRA LỖI HỆ THỐNG
  npm run build

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
