import bcrypt from 'bcryptjs'
import { getUsersCollection } from '../mongodb'

export async function createUser(email, password) {
  const users = await getUsersCollection()
  
  // Check if user already exists
  const existingUser = await users.findOne({ email })
  if (existingUser) {
    throw new Error('User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Create user
  const user = {
    email,
    password: hashedPassword,
    otp,
    otpExpires,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await users.insertOne(user)
  
  return {
    id: result.insertedId.toString(),
    email: user.email,
    otp: user.otp,
    isVerified: user.isVerified
  }
}

export async function findUserByEmail(email) {
  const users = await getUsersCollection()
  return await users.findOne({ email })
}

export async function findUserById(id) {
  const users = await getUsersCollection()
  const { ObjectId } = require('mongodb')
  return await users.findOne({ _id: new ObjectId(id) })
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function verifyOTP(email, otp) {
  const users = await getUsersCollection()
  const user = await users.findOne({ email })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.isVerified) {
    throw new Error('User already verified')
  }

  if (user.otp !== otp) {
    throw new Error('Invalid OTP')
  }

  if (new Date() > new Date(user.otpExpires)) {
    throw new Error('OTP expired')
  }

  // Update user as verified
  await users.updateOne(
    { email },
    { 
      $set: { 
        isVerified: true,
        updatedAt: new Date()
      },
      $unset: { otp: '', otpExpires: '' }
    }
  )

  return true
}

export async function resendOTP(email) {
  const users = await getUsersCollection()
  const user = await users.findOne({ email })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.isVerified) {
    throw new Error('User already verified')
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Update OTP
  await users.updateOne(
    { email },
    { 
      $set: { 
        otp,
        otpExpires,
        updatedAt: new Date()
      }
    }
  )

  return otp
}

export async function updateRefreshToken(userId, refreshToken) {
  const users = await getUsersCollection()
  const { ObjectId } = require('mongodb')
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        refreshToken,
        updatedAt: new Date()
      }
    }
  )
}

export async function removeRefreshToken(userId) {
  const users = await getUsersCollection()
  const { ObjectId } = require('mongodb')
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $unset: { refreshToken: '' },
      $set: { updatedAt: new Date() }
    }
  )
}
