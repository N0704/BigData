# BigData News Aggregator & Clustering

Dự án này là một hệ thống thu thập tin tức tự động (Crawler), phân cụm tin tức (Clustering) dựa trên nội dung và hiển thị tin tức dưới dạng web app hiện đại.

## 🏗 Cấu trúc dự án

Dự án bao gồm hai thành phần chính:
1.  **Backend (`pybig`)**: Viết bằng Python, chịu trách nhiệm crawl tin tức từ các nguồn RSS (VNExpress, Tuổi Trẻ, Dân Trí...), xử lý ngôn ngữ tự nhiên (NLP), tạo embedding và phân cụm tin tức.
2.  **Frontend (`big_data`)**: Viết bằng Next.js (React), hiển thị tin tức đã được phân cụm, hỗ trợ tìm kiếm, xem tin hot và quản lý người dùng.

Cả hai thành phần dùng chung cơ sở dữ liệu SQLite (`news.db`).

---

## 📋 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:
- **Python 3.9+**
- **Node.js 18+** và **npm**
- **Git** (tùy chọn)

---

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt Backend (Python)
Mở terminal tại thư mục `pybig` và chạy các lệnh sau:

```bash
cd pybig
# Tạo môi trường ảo (khuyên dùng)
python -m venv venv
source venv/bin/activate  # Trên Windows dùng: venv\Scripts\activate

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

### 2. Cài đặt Frontend (Next.js)
Mở terminal tại thư mục `big_data` và chạy:

```bash
cd big_data
npm install
```

---

## 🏃 Cách chạy dự án

### Cách 1: Chạy tự động (Dành cho Windows)
Tại thư mục gốc của dự án, bạn chỉ cần chạy file batch:
```cmd
run_project.bat
```
File này sẽ tự động kiểm tra dependencies, khởi động Backend (Crawler & Clustering) và Frontend (Next.js) trong hai cửa sổ riêng biệt.

### Cách 2: Chạy thủ công

**Bước 1: Khởi động Backend**
```bash
cd pybig
python main.py
```
*Lưu ý: Lần đầu chạy có thể mất thời gian để tải mô hình Embedding (Sentence-Transformers).*

**Bước 2: Khởi động Frontend**
```bash
cd big_data
npm run dev
```
Sau đó truy cập vào: [http://localhost:3000](http://localhost:3000)

---

## 🛠 Cấu hình (Tùy chỉnh)

- **Backend**: Bạn có thể điều chỉnh các tham số như `SIM_THRESHOLD`, `RSS_SOURCES`, `BATCH_INTERVAL` trong file `pybig/config.py`.
- **Frontend**: Các cấu hình môi trường nằm trong file `big_data/.env` (nếu có).

---

## ✨ Các tính năng chính
- **Auto Crawler**: Tự động lấy tin mới từ các trang báo lớn tại Việt Nam.
- **Smart Clustering**: Nhóm các bài báo có nội dung giống nhau vào cùng một cụm (Cluster) bằng thuật toán HDBSCAN/K-Means.
- **Hot Score**: Tính toán độ "hot" của tin tức dựa trên thời gian và số lượng bài báo liên quan.
- **Modern UI**: Giao diện người dùng tối giản, tốc độ cao, hỗ trợ Dark Mode và Responsive.
- **Search & Filter**: Tìm kiếm tin tức theo từ khóa và lọc theo danh mục.

---

## 📝 Ghi chú
- Cơ sở dữ liệu mặc định là SQLite (`pybig/news.db`). Nếu bạn muốn xóa dữ liệu cũ, chỉ cần xóa file này và chạy lại Backend.
- Đảm bảo kết nối internet ổn định để Crawler có thể hoạt động và tải mô hình NLP.
