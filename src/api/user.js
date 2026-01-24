import http from '../utils/http' // 使用默认导入

export const sendCode = (phone) => {
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
