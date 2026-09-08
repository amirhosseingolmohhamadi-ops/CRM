// js/db.js
// تعریف دیتابیس لوکال Dexie برای سیستم مدیریت املاک کوروش
const db = new Dexie('KoroshCRM_DB');

db.version(1).stores({
  properties: '++id, code, title, type, location, price, status, buyer, createdAt',
  contracts: '++id, contractNumber, clientName, propertyCode, amount, date',
  leads: '++id, fullName, phone, budget, demandType'
});

// تعریف سرویس به صورت مستقیم روی window برای جلوگیری از خطای ReferenceError
window.PropertyService = {
  // دریافت همه رکوردها به ترتیب جدیدترین
  async getAll() {
    return await db.properties.reverse().toArray();
  },

  // دریافت یک ملک بر اساس شناسه
  async getById(id) {
    return await db.properties.get(Number(id));
  },

  // افزودن ملک جدید
  async add(propertyData) {
    return await db.properties.add({
      ...propertyData,
      createdAt: new Date().toISOString()
    });
  },

  // ویرایش و به‌روزرسانی ملک موجود
  async update(id, updatedData) {
    return await db.properties.update(Number(id), {
      ...updatedData,
      updatedAt: new Date().toISOString()
    });
  },

  // جستجو در املاک
  async search(query) {
    return await db.properties
      .filter(p => 
        (p.title && p.title.includes(query)) || 
        (p.location && p.location.includes(query)) || 
        (p.code && p.code.includes(query))
      )
      .toArray();
  },

  // حذف بر اساس شناسه
  async delete(id) {
    return await db.properties.delete(Number(id));
  }
};

// ثبت داده‌های اولیه در صورت خالی بودن دیتابیس
async function seedInitialData() {
  const count = await db.properties.count();
  if (count === 0) {
    await db.properties.bulkAdd([
      {
        code: 'KR-042',
        title: 'پنت‌هاوس دوبلکس، خیابان فرشته',
        type: 'فروش',
        area: 450,
        rooms: 4,
        location: 'الهیه، کوچه یاس',
        address: 'الهیه، خیابان فرشته، پلاک ۱۲',
        ownerName: 'دکتر آرشام فرهمند',
        ownerPhone: '09121112233',
        buyer: 'دکتر آرشام فرهمند',
        price: '۱۵۵,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'امضای نهایی شد',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
        ],
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-043',
        title: 'ویلای مدرن، ایران‌زمین',
        type: 'رهن و اجاره',
        area: 600,
        rooms: 5,
        location: 'شهرک غرب',
        address: 'شهرک غرب، فاز ۲، خیابان ایران‌زمین',
        ownerName: 'مهندس سهراب پناهی',
        ownerPhone: '09123334455',
        buyer: 'مهندس سهراب پناهی',
        price: '۱۸,۰۰۰,۰۰۰,۰۰۰ تومان رهن',
        status: 'تحویل کلید',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
        ],
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-044',
        title: 'عرصه اداری، تقاطع اندرزگو',
        type: 'فروش',
        area: 850,
        rooms: 8,
        location: 'اندرزگو',
        address: 'اندرزگو، تقاطع فرمانیه، پلاک ۴',
        ownerName: 'هلدینگ آرمان سازه',
        ownerPhone: '02122334455',
        buyer: 'هلدینگ آرمان سازه',
        price: '۲۸۰,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'استعلام شهرداری',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
        ],
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-045',
        title: 'آپارتمان نوساز، خیابان مژده',
        type: 'فروش',
        area: 320,
        rooms: 3,
        location: 'نیاوران',
        address: 'نیاوران، خیابان مژده، بن‌بست ترنج',
        ownerName: 'خانم مهندس تهرانی',
        ownerPhone: '09124445566',
        buyer: 'خانم مهندس تهرانی',
        price: '۶۸,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'پروانه ثبت شد',
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
        ],
        createdAt: new Date().toISOString()
      }
    ]);
    console.log('داده‌های اولیه املاک با موفقیت در دیتابیس ثبت شدند.');
  }
}

seedInitialData();