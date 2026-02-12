import http from '../utils/http'

/**
 * 上传图片
 * @param file 文件对象
 * @returns
 */
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return http({
    method: 'POST',
    url: '/common/upload/img',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 上传视频
 * @param file 文件对象
 * @param onProgress 进度回调函数 (可选)
 * @returns Promise
 */
export const uploadVideo = (file, onProgress) => {
  // 创建 FormData 对象
  const formData = new FormData()
  formData.append('file', file)

  return http({
    method: 'POST',
    url: '/common/upload/img', // 修改为视频上传接口路径
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data', // 必须指定 multipart/form-data
    },
    onUploadProgress: onProgress
      ? (progressEvent) => {
          if (progressEvent.lengthComputable) {
            // 计算上传进度
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            onProgress(progress) // 调用进度回调函数
          }
        }
      : null, // 如果没有传入 onProgress，则不处理进度
  })
}
