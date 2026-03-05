import * as authService from '../services/authService.js';

export default class AuthController {

    static async changePassword(req, res, next) {
        try {
            await authService.changePassword(req.userId, req.body.currentPassword, req.body.newPassword);
            res.json({ message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            next(error);
        }
    }
    
    static async register(req, res, next) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { token, userId, fullName } = await authService.login(req.body);
            res.cookie(
                'authToken', token,{
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                    maxAge: 8 * 60 * 60 * 1000, // 8 horas
                    path: '/'
                }
            )

            res.json({ message: 'Login realizado correctamente', userId, fullName});
        } catch (error) {
            next(error);
        }
    }

    static async logout(req, res, next) {
        try {
            res.clearCookie('authToken', { path: '/' });
            res.json({ message: 'Logout realizado correctamente' });
        } catch (error) {
            next(error);
        }
    }

    static async verifyAuth(req, res, next) {
        // middleware authenticate ya validó la cookie y cargó req.userId
        try {
            res.status(200).json({ isAuthenticated: true, userId: req.userId });
        } catch (error) {
            next(error);
        }
    }

}