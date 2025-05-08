# Tài liệu API DayMood Backend

## Mô tả

Đây là tài liệu hướng dẫn sử dụng các API của ứng dụng DayMood Backend để hỗ trợ trang carddetail.tsx trong ứng dụng frontend.

## Base URL

```
http://localhost:8000/api/v1
```

## API Records

### 1. Tạo Record Mới

- **Endpoint**: `/api/records`
- **Method**: POST
- **Mô tả**: Tạo mới một bản ghi tâm trạng (mood record)
- **Request Body**:

```json
{
  "title": "Một ngày vui vẻ",
  "content": "Hôm nay tôi có rất nhiều trải nghiệm thú vị.",
  "user_id": 1,
  "mood_id": 5,
  "activity_id": [1, 3, 5],
  "status": "ACTIVE",
  "date": "2025-05-01T13:38:00.000Z"
}
```

- **Response**:

```json
{
  "statusCode": 201,
  "message": "Create a record",
  "data": {
    "id": 1,
    "title": "Một ngày vui vẻ",
    "content": "Hôm nay tôi có rất nhiều trải nghiệm thú vị.",
    "status": "ACTIVE",
    "created_time": "2023-01-01T00:00:00.000Z",
    "updated_time": "2023-01-01T00:00:00.000Z",
    "date": "2025-05-01T13:38:00.000Z",
    "mood_id": 5,
    "user_id": 1
  }
}
```

### 2. Lấy Danh Sách Records Theo User

- **Endpoint**: `/api/records?user_id=1`
- **Method**: GET
- **Mô tả**: Lấy danh sách records của một user cụ thể
- **Query Parameters**:
  - `user_id` (bắt buộc): ID của người dùng
  - `page` (tùy chọn): Số trang, mặc định là 1
  - `limit` (tùy chọn): Số lượng records mỗi trang, mặc định là 10
- **Response**:

```json
{
  "statusCode": 200,
  "message": "Get a list of records",
  "data": {
    "meta": {
      "totalRecords": 2,
      "recordsPerPage": 10,
      "totalPages": 1,
      "currentPage": 1
    },
    "items": [
      {
        "id": 2,
        "title": "Ngày hôm nay",
        "content": "Một ngày năng động",
        "status": "ACTIVE",
        "created_time": "2023-05-02T10:30:00.000Z",
        "updated_time": "2023-05-02T10:30:00.000Z",
        "date": "2025-05-02T10:30:00.000Z",
        "mood_id": 4,
        "user_id": 1
      },
      {
        "id": 1,
        "title": "Một ngày vui vẻ",
        "content": "Hôm nay tôi có rất nhiều trải nghiệm thú vị.",
        "status": "ACTIVE",
        "created_time": "2023-05-01T08:15:00.000Z",
        "updated_time": "2023-05-01T08:15:00.000Z",
        "date": "2025-05-01T08:15:00.000Z",
        "mood_id": 5,
        "user_id": 1
      }
    ]
  }
}
```

### 3. Lấy Thông Tin Chi Tiết Một Record

- **Endpoint**: `/api/records/{recordId}?user_id=1`
- **Method**: GET
- **Mô tả**: Lấy thông tin chi tiết của một record, có thể lọc theo user_id
- **Query Parameters**:
  - `user_id` (tùy chọn): ID của người dùng để xác minh quyền truy cập
- **Response**:

```json
{
  "statusCode": 200,
  "message": "Get a record",
  "data": {
    "id": 1,
    "title": "Một ngày vui vẻ",
    "content": "Hôm nay tôi có rất nhiều trải nghiệm thú vị.",
    "status": "ACTIVE",
    "created_time": "2023-05-01T08:15:00.000Z",
    "updated_time": "2023-05-01T08:15:00.000Z",
    "date": "2025-05-01T08:15:00.000Z",
    "mood_id": 5,
    "user_id": 1,
    "activities": [
      {
        "activity_id": 1,
        "record_id": 1,
        "created_time": "2023-05-01T08:15:00.000Z"
      },
      {
        "activity_id": 3,
        "record_id": 1,
        "created_time": "2023-05-01T08:15:00.000Z"
      }
    ],
    "files": [
      {
        "id": 1,
        "fname": "image1.jpg",
        "type": "image/jpeg",
        "url": "https://example.com/image1.jpg",
        "fkey": "files/image1.jpg",
        "size": 1024,
        "record_id": 1,
        "user_id": null,
        "created_time": "2023-05-01T08:15:00.000Z",
        "updated_time": "2023-05-01T08:15:00.000Z"
      }
    ]
  }
}
```

### 4. Thêm Activities cho Record

- **Endpoint**: `/api/records/{recordId}/activities`
- **Method**: POST
- **Mô tả**: Thêm danh sách các hoạt động cho một record đã tồn tại
- **Request Body**:

```json
{
  "activity_id": [1, 2, 3]
}
```

- **Response**:

```json
{
  "statusCode": 201,
  "message": "Thêm activities thành công",
  "data": [
    {
      "activity_id": 1,
      "record_id": 1,
      "created_time": "2023-01-01T00:00:00.000Z"
    },
    {
      "activity_id": 2,
      "record_id": 1,
      "created_time": "2023-01-01T00:00:00.000Z"
    },
    {
      "activity_id": 3,
      "record_id": 1,
      "created_time": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

## API Files

### 1. Lưu Thông Tin File

- **Endpoint**: `/api/files`
- **Method**: POST
- **Mô tả**: Lưu thông tin file vào database sau khi đã upload lên storage
- **Request Body**:

```json
{
  "fname": "image.jpg",
  "type": "image/jpeg",
  "url": "https://example.com/image.jpg",
  "fkey": "files/image.jpg",
  "size": 1024,
  "record_id": 1
}
```

- **Response**:

```json
{
  "statusCode": 201,
  "message": "Tạo thông tin file thành công",
  "data": {
    "id": 1,
    "fname": "image.jpg",
    "type": "image/jpeg",
    "url": "https://example.com/image.jpg",
    "fkey": "files/image.jpg",
    "size": 1024,
    "record_id": 1,
    "user_id": null,
    "created_time": "2023-01-01T00:00:00.000Z",
    "updated_time": "2023-01-01T00:00:00.000Z"
  }
}
```

## Cách Sử Dụng Trong Frontend

Các endpoint API này được thiết kế để làm việc với component CardDetailScreen. Quy trình xử lý thông thường là:

1. Tạo record để lưu tâm trạng và ghi chú
2. Thêm activities cho record (nếu cần)
3. Upload các file media (hình ảnh, âm thanh) lên storage riêng (đã được xử lý bởi các utility functions như `uploadFileFromBase64` và `uploadAudioFromUri`)
4. Lưu thông tin các file đã upload vào database

Ví dụ:

```typescript
// Tạo record
const recordResponse = await fetch('http://192.168.2.7:8000/api/v1/records', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: cardData.title,
    content: note,
    mood_id: moodId,
    user_id: 1,
    date: date.toISOString(),
  }),
});

const recordResult = await recordResponse.json();
const recordId = recordResult.data.id;

// Lấy danh sách records của user
const recordsResponse = await fetch(
  'http://192.168.2.7:8000/api/v1/records?user_id=1',
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  },
);

// Lấy thông tin chi tiết của record
const recordDetailResponse = await fetch(
  `http://192.168.2.7:8000/api/v1/records/${recordId}?user_id=1`,
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  },
);

// Thêm activities nếu có
if (activities.length > 0) {
  await fetch(`http://192.168.2.7:8000/api/v1/records/${recordId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activity_id: activities }),
  });
}

// Lưu thông tin file
await fetch('http://192.168.2.7:8000/api/v1/files', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fname: 'image.jpg',
    type: 'image/jpeg',
    url: fileInfo.url,
    fkey: fileInfo.key,
    size: fileInfo.size,
    record_id: recordId,
  }),
});
```

## Lưu ý

- Đảm bảo rằng user_id và mood_id là hợp lệ trước khi gửi request
- Khi upload file, hãy sử dụng các utility functions đã được cung cấp
- Các activities phải tồn tại trong hệ thống trước khi thêm vào record
- Trường date có thể được gửi dưới dạng ISO-8601 string, ví dụ: "2025-05-01T13:38:00.000Z"
- Tất cả các API GET đều lọc theo user_id để đảm bảo người dùng chỉ xem được dữ liệu của chính mình
