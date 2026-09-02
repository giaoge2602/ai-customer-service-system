/**
 * 附件内容上传（XHR 以获得真实上传进度；生产环境替换为对象存储预签名 PUT，接口形态一致）
 */
export function uploadAttachmentContent({ url, blob, contentType, token, onProgress }) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    if (contentType) request.setRequestHeader('Content-Type', contentType)
    if (token) request.setRequestHeader('Authorization', `Bearer ${token}`)
    if (onProgress) {
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({ status: request.status })
      } else {
        let message = `上传失败 (${request.status})`
        try {
          const body = JSON.parse(request.responseText || '{}')
          if (body.message) message = body.message
        } catch { /* 保留默认错误文案 */ }
        reject(new Error(message))
      }
    }
    request.onerror = () => reject(new Error('网络中断，请检查连接后重试'))
    request.onabort = () => reject(Object.assign(new Error('上传已取消'), { cancelled: true }))
    request.send(blob)
    return request
  })
}
