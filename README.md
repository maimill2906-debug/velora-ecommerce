
## VELORA

Repo đầy đủ frontend + backend: [github.com/maimill2906-debug/velora-ecommerce](https://github.com/maimill2906-debug/velora-ecommerce).

Repository gồm:
- **Frontend**: Vite + React (thư mục repo root)
- **Backend**: Flask Clean Architecture (thư mục `Flask-CleanArchitecture/`)

### Yêu cầu
- Node.js (khuyến nghị LTS)
- Python 3.x

### Chạy Frontend (Vite)
Tại thư mục repo root:

```bash
npm install
```

Tạo file `.env` (hoặc copy từ `.env.example`):

```bash
VITE_API_BASE_URL=http://localhost:9999
```

Chạy dev server:

```bash
npm run dev
```

Frontend sẽ gọi API backend theo `VITE_API_BASE_URL`.

### Chạy Backend (Flask)
Chi tiết: `Flask-CleanArchitecture/README.md`.

```bash
cd Flask-CleanArchitecture
py -m venv .venv
.venv\Scripts\activate.ps1
pip install -r src/requirements.txt
cd src
python app.py
```

**Admin đầu tiên:** gọi bootstrap RBAC theo `Flask-CleanArchitecture/README.md` (biến `BOOTSTRAP_TOKEN`, header `X-Bootstrap-Token`).

Backend mặc định chạy tại `http://localhost:9999` và Swagger UI ở `http://localhost:9999/docs`.
  