import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('Please add JWT secrets to .env.local')
}

export function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  )
}

export function generateRefreshToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // 7 days
  )
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET)
  } catch (error) {
    return null
  }
}
