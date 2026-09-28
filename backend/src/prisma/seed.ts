/**
 * Database Seed Script
 *
 * Run with: npm run prisma:seed
 * Populates the database with initial data for development/testing.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, VendorStatus } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  // ─── Vendor Types ─────────────────────────────────────────────────────────
  const restaurantType = await prisma.vendorType.upsert({
    where: { name: "Restaurant" },
    update: {},
    create: { name: "Restaurant", icon: "utensils", sortOrder: 1 },
  });

  await prisma.vendorType.upsert({
    where: { name: "Grocery" },
    update: {},
    create: { name: "Grocery", icon: "shopping-basket", sortOrder: 2 },
  });

  await prisma.vendorType.upsert({
    where: { name: "Pharmacy" },
    update: {},
    create: { name: "Pharmacy", icon: "pill", sortOrder: 3 },
  });

  await prisma.vendorType.upsert({
    where: { name: "Hardware" },
    update: {},
    create: { name: "Hardware", icon: "wrench", sortOrder: 4 },
  });

  console.log("✅ Vendor types seeded");

  // ─── City ─────────────────────────────────────────────────────────────────
  const city = await prisma.city.upsert({
    where: { name: "Hostel City, Islamabad" },
    update: {},
    create: {
      name: "Hostel City, Islamabad",
      state: "Islamabad Capital Territory",
      country: "Pakistan",
    },
  });

  console.log("✅ City seeded");

  // ─── Admin User ───────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@sabkuch.app" },
    update: {},
    create: {
      name: "Sab Kuch Admin",
      email: "admin@sabkuch.app",
      role: UserRole.ADMIN,
      isVerified: true,
      customerId: "SK-ADMIN-001",
      cityId: city.id,
    },
  });

  console.log("✅ Admin user seeded");

  // ─── Sample Vendor ────────────────────────────────────────────────────────
  const vendor = await prisma.vendor.upsert({
    where: { slug: "the-burger-joint" },
    update: {},
    create: {
      slug: "the-burger-joint",
      name: "The Burger Joint",
      description: "Home of the best smash burgers in the city",
      cityId: city.id,
      vendorTypeId: restaurantType.id,
      status: VendorStatus.ACTIVE,
      estimatedDeliveryMinutes: 25,
      deliveryFee: 30,
      minimumOrderAmount: 100,
    },
  });

  // Operating hours — Mon–Sat 10am–10pm, closed Sunday
  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    await prisma.operatingHours.upsert({
      where: { vendorId_dayOfWeek: { vendorId: vendor.id, dayOfWeek: day } },
      update: {},
      create: {
        vendorId: vendor.id,
        dayOfWeek: day,
        openTime: "10:00",
        closeTime: "22:00",
        isClosed: day === 0, // closed on Sunday
      },
    });
  }

  console.log("✅ Sample vendor seeded");

  // ─── Sample Category & Products ───────────────────────────────────────────
  const category = await prisma.category.upsert({
    where: { vendorId_name: { vendorId: vendor.id, name: "Burgers" } },
    update: {},
    create: {
      vendorId: vendor.id,
      name: "Burgers",
      description: "Juicy smash burgers",
      sortOrder: 1,
    },
  });

  const products = [
    {
      name: "Classic Smash Burger",
      price: 199,
      isFeatured: true,
      description: "Double patty, cheddar, pickles",
    },
    {
      name: "Spicy Chicken Burger",
      price: 179,
      isFeatured: true,
      description: "Crispy chicken, jalapeño mayo",
    },
    {
      name: "Veggie Delight",
      price: 149,
      isFeatured: false,
      description: "Black bean patty, avocado",
    },
  ];

  for (const p of products) {
    const productId = `seed-${vendor.id}-${p.name.replace(/\s+/g, "-").toLowerCase()}`;
    await prisma.product.upsert({
      where: { id: productId },
      update: {},
      create: {
        id: productId,
        vendorId: vendor.id,
        categoryId: category.id,
        ...p,
      },
    });
  }

  console.log("✅ Sample products seeded");

  // ─── Default Banner Cards ──────────────────────────────────────────────────
  const bannerCount = await prisma.bannerCard.count();
  if (bannerCount === 0) {
    await prisma.bannerCard.createMany({
      data: [
        {
          title: '50% OFF your first order',
          description: 'Use code WELCOME50',
          gradient: 'from-orange-500 to-amber-500',
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
          sortOrder: 0,
          isActive: true,
        },
        {
          title: 'Free delivery today 🛵',
          description: 'On all orders above Rs. 300',
          gradient: 'from-amber-500 to-orange-500',
          imageUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&auto=format&fit=crop&q=80',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: "Custom orders now live!",
          description: "We'll buy anything for you",
          gradient: 'from-red-500 to-orange-500',
          imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
          sortOrder: 2,
          isActive: true,
        },
      ],
    });
    console.log("✅ Promotional banner cards seeded");
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
