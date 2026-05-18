/*
{
  "success": true,
  "data": {
    "media_uuid": "0651d668-44ed-4d1c-ae37-f07a63f48d6e",
    "file_url": "https://2026capstone-cig.s3.ap-northeast-2.amazonaws.com/uploads/1/0651d668-44ed-4d1c-ae37-f07a63f48d6e.jpg"
  },
  "message": "파일이 업로드되었습니다."
}
*/

export interface MediaUploadResponse {
  mediaUuid: string;
  fileUrl: string;
}