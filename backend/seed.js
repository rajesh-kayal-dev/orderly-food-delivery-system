require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Neon database with Orderly initial data...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.deliveryPartner.deleteMany();
  await prisma.customerSupport.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ofds.com',
      password_hash: defaultPassword,
      full_name: 'System Admin',
      phone_number: '1234567890',
      role: 'admin',
      admin: {
        create: { department: 'Operations' }
      }
    }
  });
  console.log('Admin user created:', adminUser.email);

  // 2. Customer Support
  const supportUser = await prisma.user.create({
    data: {
      email: 'support@ofds.com',
      password_hash: defaultPassword,
      full_name: 'Customer Support',
      phone_number: '1234567891',
      role: 'customer_support',
      customerSupport: {
        create: { support_level: 'Tier 1' }
      }
    }
  });
  console.log('Support user created:', supportUser.email);

  // 3. Restaurant User & Restaurant
  const restaurantUser = await prisma.user.create({
    data: {
      email: 'restaurant@ofds.com',
      password_hash: defaultPassword,
      full_name: 'Mario Rossi',
      phone_number: '1234567892',
      role: 'restaurant'
    }
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      user_id: restaurantUser.id,
      name: 'Orderly Gourmet Hub',
      description: 'Delicious artisan meals delivered fast and fresh.',
      address: '123 Flavor Street, Foodie City',
      rating: 4.8,
      opens_at: '09:00',
      closes_at: '22:00'
    }
  });

  const cat1 = await prisma.menuCategory.create({
    data: {
      restaurant_id: restaurant.id,
      name: 'Popular Items',
      sort_order: 1
    }
  });

  await prisma.menuItem.createMany({
    data: [
      {
        restaurant_id: restaurant.id,
        category_id: cat1.id,
        name: 'Orderly Classic Burger',
        description: 'Juicy beef patty with sharp cheddar, crisp lettuce, and signature sauce.',
        price: 12.99,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        is_available: true
      },
      {
        restaurant_id: restaurant.id,
        category_id: cat1.id,
        name: 'Truffle Fries',
        description: 'Crispy golden fries tossed in truffle oil and parmesan cheese.',
        price: 6.50,
        image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
        is_available: true
      }
    ]
  });

  const cat2 = await prisma.menuCategory.create({
    data: {
      restaurant_id: restaurant.id,
      name: 'Beverages & Desserts',
      sort_order: 2
    }
  });

  await prisma.menuItem.create({
    data: {
      restaurant_id: restaurant.id,
      category_id: cat2.id,
      name: 'Fresh Berry Lemonade',
      description: 'Hand-squeezed lemonade with fresh organic raspberries.',
      price: 4.50,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
      is_available: true
    }
  });
  console.log('Restaurant user and menu created:', restaurantUser.email);

  // 4. Delivery Partner
  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@ofds.com',
      password_hash: defaultPassword,
      full_name: 'Alex Express',
      phone_number: '1234567893',
      role: 'delivery_partner',
      deliveryPartner: {
        create: {
          vehicle_type: 'Motorcycle',
          vehicle_number: 'OD-01-EV-9999',
          is_available: true,
          current_lat: 28.6139,
          current_lng: 77.2090,
          rating: 4.9
        }
      }
    }
  });
  console.log('Delivery partner user created:', driverUser.email);

  // 5. Customer
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@ofds.com',
      password_hash: defaultPassword,
      full_name: 'John Orderly',
      phone_number: '1234567894',
      role: 'customer'
    }
  });

  const customer = await prisma.customer.create({
    data: {
      user_id: customerUser.id
    }
  });

  await prisma.cart.create({
    data: {
      customer_id: customer.id,
      total_amount: 0.0
    }
  });

  await prisma.address.create({
    data: {
      user_id: customerUser.id,
      address_line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62701',
      latitude: 28.6150,
      longitude: 77.2100,
      is_default: true
    }
  });
  console.log('Customer user created:', customerUser.email);

  console.log('Database seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
