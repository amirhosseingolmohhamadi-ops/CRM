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

  // افزودن ملک جدید
  async add(propertyData) {
    return await db.properties.add({
      ...propertyData,
      createdAt: new Date().toISOString()
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
    return await db.properties.delete(id);
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
        location: 'الهیه',
        buyer: 'دکتر آرشام فرهمند',
        price: '۱۵۵,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'امضای نهایی شد',
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-043',
        title: 'ویلای مدرن، ایران‌زمین',
        type: 'رهن و اجاره',
        location: 'شهرک غرب',
        buyer: 'مهندس سهراب پناهی',
        price: '۱۸,۰۰۰,۰۰۰,۰۰۰ تومان رهن',
        status: 'تحویل کلید',
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-044',
        title: 'عرصه اداری، تقاطع اندرزگو',
        type: 'فروش',
        location: 'اندرزگو',
        buyer: 'هلدینگ آرمان سازه',
        price: '۲۸۰,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'استعلام شهرداری',
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-045',
        title: 'آپارتمان ۳۲۰ متری نوساز، خیابان مژده',
        type: 'فروش',
        location: 'نیاوران',
        buyer: 'خانم مهندس تهرانی',
        price: '۶۸,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'پروانه ثبت شد',
        createdAt: new Date().toISOString()
      },
      {
        code: 'KR-046',
        title: 'برج باغ مسکونی، طبقه ۱۸',
        type: 'فروش',
        location: 'فرمانیه',
        buyer: 'دکتر کیوان صادقی',
        price: '۱۱۰,۰۰۰,۰۰۰,۰۰۰ تومان',
        status: 'آماده مبایعه‌نامه',
        createdAt: new Date().toISOString()
      }
    ]);
    console.log('داده‌های اولیه املاک با موفقیت در دیتابیس ثبت شدند.');
  }
}

seedInitialData();