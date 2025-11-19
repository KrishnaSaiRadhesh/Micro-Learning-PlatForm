const User = require('../models/user');

class UserRepository {
  async create(userData) {
    return User.create(userData);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }
}

module.exports = new UserRepository();