import http from '../utils/http' // 使用默认导入

export const sendSmsCode = (phone) => {
  return http({
    method: 'POST',
    url: '/common/sendSms?phone=' + phone,
  })
}

export const passwordLogin = (userCode, password) => {
  return http({
    method: 'POST',
    url: `/auth/login?userCode=${userCode}&password=${password}`,
  })
}
/**
 * 更换⽤户⼿机号
 * @param phone ⼿机号
 * @param code 验证码
 * @returns
 */
export const updateUserPhone = (phone, code) => {
  return http({
    method: 'POST',
    url: `/auth/bindPhone?phone=${phone}&code=${code}`,
  })
}
/**
 * 退出登录
 * @returns
 */
export const logout = () => {
  return http({
    method: 'POST',
    url: '/auth/logout',
  })
}
/**
 * 获取用户信息
 * @returns
 */
export const getUserInfo = () => {
  return http({
    method: 'GET',
    url: '/user/info',
  })
}

/**
 * 更新⽤户信息
 * @param data
 * @returns
 */
export const updateUserInfo = (data) => {
  return http({
    method: 'POST',
    url: '/user/update',
    data,
  })
}
