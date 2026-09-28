/**
 * SAB KUCH — Database Clean & Seed Script
 *
 * Clears all existing database records and seeds:
 *  - 1 City (Hostel City, Islamabad)
 *  - 4 Vendor Types (Restaurant, Grocery, Pharmacy, Stationery & Tech)
 *  - 1 Admin User (msd.sheraz046@gmail.com)
 *  - 5 Complete Shops with Unsplash stock cover/logo images & 24/7 operating hours
 *  - 10 Realistic Products for each shop (50 products total) with public Unsplash stock images
 *  - 3 Home Screen Banner Cards with Unsplash images
 *  - 12 Public Search Tags
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, VendorStatus, ProductStatus } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  console.log("🧹 Clearing all existing data from database...");

  // Ensure banner_cards table exists before truncate
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS banner_cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      "imageUrl" TEXT,
      "linkUrl" TEXT,
      gradient TEXT DEFAULT 'from-orange-500 to-amber-500',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Query all user tables in public schema
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' 
      AND tablename NOT IN ('_prisma_migrations');
  `;

  for (const { tablename } of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      console.log(`  ✓ Cleared table: ${tablename}`);
    } catch (err) {
      console.warn(`  ⚠ Error truncating ${tablename}:`, err);
    }
  }

  console.log("✅ Database completely wiped clean.");
}

async function main() {
  await clearDatabase();

  console.log("🌱 Seeding brand new data...");

  // ─── 1. City ──────────────────────────────────────────────────────────────
  const city = await prisma.city.create({
    data: {
      name: "Hostel City, Islamabad",
      state: "Islamabad Capital Territory",
      country: "Pakistan",
      isActive: true,
    },
  });
  console.log("✅ City created:", city.name);

  // ─── 2. Vendor Types ──────────────────────────────────────────────────────
  const restaurantType = await prisma.vendorType.create({
    data: { name: "Restaurant", icon: "utensils", sortOrder: 1, isActive: true },
  });
  const groceryType = await prisma.vendorType.create({
    data: { name: "Grocery", icon: "shopping-basket", sortOrder: 2, isActive: true },
  });
  const pharmacyType = await prisma.vendorType.create({
    data: { name: "Pharmacy", icon: "pill", sortOrder: 3, isActive: true },
  });
  const techStationeryType = await prisma.vendorType.create({
    data: { name: "Stationery & Tech", icon: "wrench", sortOrder: 4, isActive: true },
  });
  console.log("✅ Vendor types created");

  // ─── 3. Admin User ────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      name: "Muhammad Sheraz",
      email: "msd.sheraz046@gmail.com",
      phone: "+923001234567",
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
      customerId: "SK-ADMIN-001",
      cityId: city.id,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // ─── 4. The 5 Shops and 10 Products Each ──────────────────────────────────
  const shopsData = [
    {
      name: "The Burger Joint",
      slug: "the-burger-joint",
      description: "Juicy handcrafted smash burgers, loaded crispy fries, and refreshing thick shakes.",
      vendorTypeId: restaurantType.id,
      address: "Shop 4, Commercial Market, Hostel City, Islamabad",
      phone: "+923115550101",
      email: "burgers@sabkuch.app",
      coverImageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80",
      averageRating: 4.8,
      totalRatings: 134,
      estimatedDeliveryMinutes: 25,
      minimumOrderAmount: 100,
      deliveryFee: 30,
      categoryName: "Smash Burgers & Fast Food",
      categoryImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
      products: [
        {
          name: "Classic Beef Smash Burger",
          description: "Double smashed beef patty with melted cheddar, pickles, and secret house sauce.",
          price: 380,
          discountedPrice: 349,
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "burger",
        },
        {
          name: "Crispy Zinger Chicken Burger",
          description: "Golden crispy chicken fillet, spicy garlic mayo, and crunchy iceberg lettuce.",
          price: 350,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "burger",
        },
        {
          name: "Smoky BBQ Bacon Burger",
          description: "Flame-grilled patty loaded with smoky barbecue glaze, crispy bacon, and cheddar.",
          price: 440,
          discountedPrice: 399,
          imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "burger",
        },
        {
          name: "Spicy Jalapeño Crunch Burger",
          description: "Double patty topped with pickled jalapeños, fiery chipotle sauce, and pepper jack.",
          price: 390,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "burger",
        },
        {
          name: "Garden Veggie Delight Burger",
          description: "Crisp seasoned vegetable patty with fresh tomato, lettuce, and tangy garlic herb mayo.",
          price: 280,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "burger",
        },
        {
          name: "Loaded Cheddar Cheese Fries",
          description: "Golden crispy fries smothered in warm cheddar cheese sauce and jalapeño bits.",
          price: 260,
          discountedPrice: 220,
          imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "box",
        },
        {
          name: "Crispy Chicken Tenders (4 Pcs)",
          description: "Tender chicken strips crumb-coated and fried to golden perfection with honey mustard dip.",
          price: 320,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "portion",
        },
        {
          name: "Golden Crispy Onion Rings",
          description: "Crispy battered sweet onion rings served hot with creamy ranch dip.",
          price: 190,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1639024471287-03521672322b?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "box",
        },
        {
          name: "Belgian Chocolate Thick Shake",
          description: "Rich blended chocolate ice cream shake topped with whipped cream and cocoa drizzle.",
          price: 290,
          discountedPrice: 250,
          imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "glass",
        },
        {
          name: "Chilled Soft Drink (Can 330ml)",
          description: "Ice-cold canned beverage of your choice (Cola, Sprite, or Fanta).",
          price: 100,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "can",
        },
      ],
    },

    {
      name: "Hostel Chai & Naan Dhaba",
      slug: "hostel-chai-naan",
      description: "Authentic student dhaba serving piping hot Karak Chai, stuffed naans, crisp parathas, and breakfast.",
      vendorTypeId: restaurantType.id,
      address: "Main Gate Dhaba Street, Hostel City, Islamabad",
      phone: "+923115550202",
      email: "dhaba@sabkuch.app",
      coverImageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1000&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
      averageRating: 4.9,
      totalRatings: 210,
      estimatedDeliveryMinutes: 20,
      minimumOrderAmount: 60,
      deliveryFee: 20,
      categoryName: "Desi Dhaba, Chai & Parathas",
      categoryImage: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
      products: [
        {
          name: "Special Karak Doodh Patti Chai",
          description: "Strong, slow-brewed buffalo milk tea with crushed green cardamom.",
          price: 70,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "cup",
        },
        {
          name: "Chicken Cheese Stuffed Naan",
          description: "Tandoori naan packed with spiced shredded chicken and molten mozzarella cheese.",
          price: 320,
          discountedPrice: 280,
          imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "piece",
        },
        {
          name: "Crispy Aloo Paratha with Raita",
          description: "Desi ghee shallow-fried paratha filled with mashed spiced potatoes and fresh herbs.",
          price: 140,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "plate",
        },
        {
          name: "Chicken Tikka Paratha Roll",
          description: "Charcoal grilled tikka boti rolled in crispy paratha with onions and mint green chutney.",
          price: 220,
          discountedPrice: 199,
          imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "roll",
        },
        {
          name: "Anda Shami Street Bun Kabab",
          description: "Classic Karachi-style lentil & beef shami patty dipped in fluffy egg with onions and tamarind chutney.",
          price: 130,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "burger",
        },
        {
          name: "Warm Nutella Sweet Naan",
          description: "Freshly baked tandoori naan overflowing with warm Nutella and crushed almonds.",
          price: 280,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "piece",
        },
        {
          name: "Desi Halwa Puri Breakfast Thali",
          description: "2 hot puffy puris served with spiced chana tarkari, aloo bhujia, and sweet semolina halwa.",
          price: 180,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "thali",
        },
        {
          name: "Chilled Sweet Punjabi Lassi",
          description: "Traditional thick creamy yogurt drink served chilled with fresh malai on top.",
          price: 130,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "glass",
        },
        {
          name: "Pink Kashmiri Chai with Dry Fruit",
          description: "Slow-brewed traditional pink noon chai loaded with sliced pistachios and crushed almonds.",
          price: 110,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "cup",
        },
        {
          name: "Butter Roghani Naan with Sesame",
          description: "Soft, golden butter-brushed tandoori naan topped with roasted white sesame seeds.",
          price: 60,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "piece",
        },
      ],
    },

    {
      name: "Green Mart & Fresh Groceries",
      slug: "green-mart-groceries",
      description: "Your 24/7 one-stop shop for snacks, dairy, drinks, and all hostel room pantry staples.",
      vendorTypeId: groceryType.id,
      address: "Plaza 2, Central Avenue, Hostel City, Islamabad",
      phone: "+923115550303",
      email: "greenmart@sabkuch.app",
      coverImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80",
      averageRating: 4.7,
      totalRatings: 98,
      estimatedDeliveryMinutes: 20,
      minimumOrderAmount: 80,
      deliveryFee: 25,
      categoryName: "Snacks, Dairy & Daily Essentials",
      categoryImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      products: [
        {
          name: "Lays Classic Salted Chips (Large 65g)",
          description: "Crisp, golden sliced potato chips with the iconic sprinkle of fine salt.",
          price: 100,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "pack",
        },
        {
          name: "Kurkure Masala Munch (100g)",
          description: "Spicy, crunchy puffed corn curls packed with tangy South Asian spices.",
          price: 90,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "pack",
        },
        {
          name: "Olper's Full Cream Milk (1 Litre)",
          description: "UHT treated 100% pure nutritious full cream dairy milk for tea and cereal.",
          price: 290,
          discountedPrice: 275,
          imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "tetra pack",
        },
        {
          name: "Tapal Danedar Black Tea (450g Box)",
          description: "Premium granular black tea leaves providing full body, rich aroma, and brisk taste.",
          price: 680,
          discountedPrice: 640,
          imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "box",
        },
        {
          name: "Cadbury Dairy Milk Chocolate (60g)",
          description: "Smooth and creamy milk chocolate bar made with the finest quality cocoa.",
          price: 160,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "bar",
        },
        {
          name: "Dawn Plain White Bread (Family Size)",
          description: "Freshly baked soft sliced white bread, perfect for toast and quick hostel sandwiches.",
          price: 180,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "pack",
        },
        {
          name: "Farm Fresh Brown Eggs (Pack of 12)",
          description: "Fresh high-protein poultry brown eggs sourced directly from farms.",
          price: 340,
          discountedPrice: 310,
          imageUrl: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "dozen",
        },
        {
          name: "Aquafina Mineral Water (1.5 Litre)",
          description: "Purified drinking water with balanced essential minerals for daily hydration.",
          price: 110,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "bottle",
        },
        {
          name: "Red Bull Energy Drink (250ml Can)",
          description: "Vitalizes body and mind during late-night study sessions and exam preparation.",
          price: 380,
          discountedPrice: 350,
          imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "can",
        },
        {
          name: "Knorr Instant Noodles (Chatpatta 6-Pack)",
          description: "Quick 2-minute savory spicy chatpatta instant noodles, student favorite.",
          price: 360,
          discountedPrice: 320,
          imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "pack",
        },
      ],
    },

    {
      name: "City Care Pharmacy & Wellness",
      slug: "city-care-pharmacy",
      description: "Licensed pharmacy offering emergency medicines, first aid, vitamins, and hygiene essentials.",
      vendorTypeId: pharmacyType.id,
      address: "Shop 12, Hospital Road, Hostel City, Islamabad",
      phone: "+923115550404",
      email: "pharmacy@sabkuch.app",
      coverImageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1000&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
      averageRating: 4.9,
      totalRatings: 156,
      estimatedDeliveryMinutes: 15,
      minimumOrderAmount: 50,
      deliveryFee: 20,
      categoryName: "Medicines, First Aid & Personal Care",
      categoryImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      products: [
        {
          name: "Panadol Extra 500mg (Strip of 10)",
          description: "Fast relief for stubborn headaches, body pains, fever, and common aches.",
          price: 50,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "strip",
        },
        {
          name: "Disprin Fast Action Tablets (Pack of 10)",
          description: "Soluble pain relief analgesic tablets for rapid ease of migraines and fever.",
          price: 40,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "pack",
        },
        {
          name: "Hansaplast Waterproof Band-Aids (Pack of 20)",
          description: "Breathable, strong-stick adhesive bandages for cuts, scrapes, and blisters.",
          price: 150,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "box",
        },
        {
          name: "Hydrite ORS Electrolyte Powder (5 Sachets)",
          description: "Instant oral rehydration salts for dehydration, stomach flu, and fatigue recovery.",
          price: 100,
          discountedPrice: 85,
          imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "box",
        },
        {
          name: "Dettol Antiseptic Liquid (100ml)",
          description: "Trusted first aid antiseptic liquid for cleansing cuts, grazes, and skin hygiene.",
          price: 220,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "bottle",
        },
        {
          name: "Voltral Emulgel Pain Relief (20g)",
          description: "Targeted topical relief gel for neck stiffness, sprains, and back muscle aches.",
          price: 260,
          discountedPrice: 235,
          imageUrl: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "tube",
        },
        {
          name: "Strepsils Honey & Lemon (Pack of 16)",
          description: "Warm soothing antibacterial lozenges for throat irritation and dry cough.",
          price: 160,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "pack",
        },
        {
          name: "Dettol Instant Hand Sanitizer (50ml)",
          description: "Kills 99.9% of bacteria and viruses without water, compact pocket bottle.",
          price: 130,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "bottle",
        },
        {
          name: "Surgical 3-Ply Face Masks (Pack of 20)",
          description: "High-filtration comfortable earloop protective face masks.",
          price: 180,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "box",
        },
        {
          name: "Surbex Z Zinc & Vitamin C Complex (30 Tablets)",
          description: "High potency daily dietary supplement for immune defense and physical energy.",
          price: 380,
          discountedPrice: 340,
          imageUrl: "https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "bottle",
        },
      ],
    },

    {
      name: "Campus Stationers & Tech Store",
      slug: "campus-stationers",
      description: "Notebooks, scientific calculators, stationery supplies, charging cables, and extension cords.",
      vendorTypeId: techStationeryType.id,
      address: "Student Center Plaza, Sector B, Hostel City, Islamabad",
      phone: "+923115550505",
      email: "stationery@sabkuch.app",
      coverImageUrl: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1000&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80",
      averageRating: 4.8,
      totalRatings: 112,
      estimatedDeliveryMinutes: 20,
      minimumOrderAmount: 100,
      deliveryFee: 25,
      categoryName: "Stationery & Tech Essentials",
      categoryImage: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=600&auto=format&fit=crop&q=80",
      products: [
        {
          name: "A4 Hardcover Spiral Notebook (200 Pages)",
          description: "Durable ruled college notebook ideal for engineering and university lecture notes.",
          price: 250,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "piece",
        },
        {
          name: "Piano Crystal Ballpoint Pen Set (Pack of 10)",
          description: "Smooth flow smudge-proof pens (5 Blue + 5 Black) suitable for rapid exam writing.",
          price: 120,
          discountedPrice: 100,
          imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "pack",
        },
        {
          name: "Casio Scientific Calculator FX-991ES Plus",
          description: "Standard 417-function natural textbook display calculator for exams & lab work.",
          price: 2800,
          discountedPrice: 2599,
          imageUrl: "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48f?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "piece",
        },
        {
          name: "Pastel Sticky Notes Multi-Color (400 Sheets)",
          description: "Self-adhesive repositionable memo notes for textbook bookmarks and dorm reminders.",
          price: 180,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "pad",
        },
        {
          name: "Stabilo Boss Pastel Highlighters (Pack of 4)",
          description: "Subtle pastel colored fluorescent highlighters with anti-dry out ink technology.",
          price: 380,
          discountedPrice: 340,
          imageUrl: "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "pack",
        },
        {
          name: "Heavy Duty 4-Way Power Extension Board (3m)",
          description: "Surge-protected multi-socket power strip essential for laptop and phone charging in dorms.",
          price: 850,
          discountedPrice: 790,
          imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80",
          isFeatured: true,
          unit: "piece",
        },
        {
          name: "Fast Charging Braided USB-C Cable (1.5m)",
          description: "Heavy duty nylon braided 60W fast-charging and data transmission cable.",
          price: 390,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "cable",
        },
        {
          name: "SanDisk Ultra 32GB USB 3.0 Flash Drive",
          description: "High-speed compact thumb drive for project submission and lab file transfers.",
          price: 750,
          discountedPrice: 699,
          imageUrl: "https://images.unsplash.com/photo-1618410320928-25228d811631?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "piece",
        },
        {
          name: "Precision Geometry & Compass Tin Box",
          description: "Comprehensive mathematical drawing instruments set in an organized tin box.",
          price: 290,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1580584126903-c17d41830450?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "set",
        },
        {
          name: "Deli Desktop Stapler with 1000 Pins",
          description: "Smooth 25-sheet binding stapler with jam-free mechanism for assignments.",
          price: 320,
          discountedPrice: null,
          imageUrl: "https://images.unsplash.com/photo-1585336261026-613d744fbe79?w=600&auto=format&fit=crop&q=80",
          isFeatured: false,
          unit: "piece",
        },
      ],
    },
  ];

  for (const shop of shopsData) {
    const vendor = await prisma.vendor.create({
      data: {
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        vendorTypeId: shop.vendorTypeId,
        cityId: city.id,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        coverImageUrl: shop.coverImageUrl,
        logoUrl: shop.logoUrl,
        averageRating: shop.averageRating,
        totalRatings: shop.totalRatings,
        estimatedDeliveryMinutes: shop.estimatedDeliveryMinutes,
        minimumOrderAmount: shop.minimumOrderAmount,
        deliveryFee: shop.deliveryFee,
        status: VendorStatus.ACTIVE,
      },
    });

    // 24/7 Operating Hours for all 7 days so shops are always open
    for (let day = 0; day <= 6; day++) {
      await prisma.operatingHours.create({
        data: {
          vendorId: vendor.id,
          dayOfWeek: day,
          openTime: "00:00",
          closeTime: "23:59",
          isClosed: false,
        },
      });
    }

    // Category
    const category = await prisma.category.create({
      data: {
        vendorId: vendor.id,
        name: shop.categoryName,
        imageUrl: shop.categoryImage,
        sortOrder: 1,
        isActive: true,
      },
    });

    // 10 Products for this vendor
    for (let i = 0; i < shop.products.length; i++) {
      const p = shop.products[i];
      await prisma.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: category.id,
          name: p.name,
          description: p.description,
          price: p.price,
          discountedPrice: p.discountedPrice,
          imageUrl: p.imageUrl,
          status: ProductStatus.AVAILABLE,
          isFeatured: p.isFeatured,
          sortOrder: i + 1,
          unit: p.unit,
        },
      });
    }

    console.log(`✅ Seeded shop "${shop.name}" with 10 products`);
  }

  // ─── 5. Banner Cards ──────────────────────────────────────────────────────
  await prisma.bannerCard.createMany({
    data: [
      {
        title: "50% OFF your first order",
        description: "Use code WELCOME50 on checkout",
        gradient: "from-orange-500 to-amber-500",
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
        sortOrder: 0,
        isActive: true,
      },
      {
        title: "Free delivery in Hostel City 🛵",
        description: "Zero delivery fee on all orders above Rs. 300",
        gradient: "from-amber-500 to-orange-500",
        imageUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=80",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Custom orders now live!",
        description: "We'll buy & deliver anything right to your hostel door",
        gradient: "from-red-500 to-orange-500",
        imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        sortOrder: 2,
        isActive: true,
      },
    ],
  });
  console.log("✅ Promotional banner cards seeded");

  // ─── 6. Search Tags ───────────────────────────────────────────────────────
  const searchTags = [
    "Burger",
    "Chai",
    "Paratha",
    "Biryani",
    "Roll",
    "Chips",
    "Panadol",
    "Notebook",
    "Calculator",
    "Milk",
    "Ice Cream",
    "Cold Drink",
  ];

  await prisma.searchTag.createMany({
    data: searchTags.map((name, idx) => ({
      name,
      sortOrder: idx,
      isActive: true,
    })),
    skipDuplicates: true,
  });
  console.log("✅ Search tags seeded");

  // Verify counts
  const [vendorsCount, productsCount, bannersCount, usersCount] = await Promise.all([
    prisma.vendor.count(),
    prisma.product.count(),
    prisma.bannerCard.count(),
    prisma.user.count(),
  ]);

  console.log("═══════════════════════════════════════════");
  console.log("🎉 DATABASE RE-SEEDED SUCCESSFULLY!");
  console.log(`   - Shops (Vendors): ${vendorsCount}`);
  console.log(`   - Products:        ${productsCount}`);
  console.log(`   - Banners:         ${bannersCount}`);
  console.log(`   - Users:           ${usersCount} (Admin: ${adminUser.email})`);
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
