let mongoose = require('mongoose');
let roleModel = require('../schemas/roles');
let userModel = require('../schemas/users');

async function seedData() {
  try {
    console.log('Starting seed data...');

    // 1. Tao roles
    let userRole = await roleModel.findOne({ name: 'USER' });
    if (!userRole) {
      userRole = new roleModel({ name: 'USER', description: 'Normal user' });
      await userRole.save();
      console.log('Created role: USER');
    }

    let adminRole = await roleModel.findOne({ name: 'ADMIN' });
    if (!adminRole) {
      adminRole = new roleModel({ name: 'ADMIN', description: 'Administrator' });
      await adminRole.save();
      console.log('Created role: ADMIN');
    }

    // 2. Tao admin user
    let adminUser = await userModel.findOne({ username: 'admin' });
    if (!adminUser) {
      adminUser = new userModel({
        username: 'admin',
        password: 'Admin@123',
        email: 'admin@socialmedia.com',
        fullName: 'Administrator',
        role: adminRole._id,
        status: true
      });
      await adminUser.save();
      console.log('Created admin user: admin / Admin@123');
    }

    // 3. Tao test users
    let testUser1 = await userModel.findOne({ username: 'testuser1' });
    if (!testUser1) {
      testUser1 = new userModel({
        username: 'testuser1',
        password: 'Test@123',
        email: 'test1@socialmedia.com',
        fullName: 'Test User 1',
        role: userRole._id,
        status: true
      });
      await testUser1.save();
      console.log('Created test user: testuser1 / Test@123');
    }

    let testUser2 = await userModel.findOne({ username: 'testuser2' });
    if (!testUser2) {
      testUser2 = new userModel({
        username: 'testuser2',
        password: 'Test@123',
        email: 'test2@socialmedia.com',
        fullName: 'Test User 2',
        role: userRole._id,
        status: true
      });
      await testUser2.save();
      console.log('Created test user: testuser2 / Test@123');
    }

    console.log('Seed data completed!');
    console.log('---');
    console.log('Admin login: admin / Admin@123');
    console.log('Test login:  testuser1 / Test@123');
    console.log('Test login:  testuser2 / Test@123');
  } catch (error) {
    console.log('Seed error:', error.message);
  }
}

module.exports = { seedData };
