import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import * as userRepository from '../repositories/userRepository.js';


export const changePassword = async (userId,currentPassword, newPassword) =>{
    const user = await userRepository.getByIdWithPassword(userId);
    if (!user){
        throw new Error('Usuario no encontrado');
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
        throw new Error('Contraseña actual incorrecta');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePasswordHash(userId, newHash);
    return { message: 'Contraseña actualizada' };
}

export const register = async ({ email, full_name, password }) => {

  const existing = await userRepository.getByEmail(email);
  if (existing) throw new Error('Email already registered');

  const password_hash = await bcrypt.hash(password, 12);

  const user = await userRepository.create({
    id: randomUUID(),
    email,
    full_name,
    password_hash
  });

  return user;
};

export const login = async ({ email, password }) => {

  const user = await userRepository.getByEmail(email);
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { id: user.id , full_name: user.full_name },
    
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  
  // Actualizar último login
  await userRepository.updateLastLogin(user.id);

  return { token, userId: user.id, fullName: user.full_name };
};

