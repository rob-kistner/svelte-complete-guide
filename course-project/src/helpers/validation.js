export function isEmpty(val)
{
  return val.trim().length === 0
}

export function isValidEmail(val)
{
  const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRE.test(val)
}