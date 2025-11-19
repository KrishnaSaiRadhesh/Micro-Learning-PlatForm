const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepository');

class AuthService {
  async register(email, password) {
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) throw new Error('User already exists');
    return userRepo.create({ email, password });
  }

  async login(email, password) {
    const user = await userRepo.findByEmail(email);
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { user: { id: user._id, email: user.email, role: user.role }, token };
  }
}

module.exports = new AuthService();