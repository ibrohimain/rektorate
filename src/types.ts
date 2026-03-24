export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone1: string;
  phone2: string;
  workplace: string;
  address: string;
  position: string;
  bio: string;
  role: 'user' | 'admin';
  adminRole?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  dateTime: string;
  purpose: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_ACCOUNTS = [
  { 
    email: 'alisherusmankulov@gmail.com', 
    role: 'Jizzax politexnika instituti rektori',
    fullName: 'Usmankulov Alisher Kadirkulovich'
  },
  { 
    email: 'jamshid@gmail.com', 
    role: 'Ilmiy ishlar va innovatsiyalar bo\'yicha prorektor',
    fullName: 'Jamshid Nurmuxamatovich Abdunazarov'
  },
  { 
    email: 'sanobar@gmail.com', 
    role: 'Yoshlar masalalari va ma\'naviy-ma\'rifiy ishlar bo\'yicha birinchi prorektor',
    fullName: 'Eshbekova Sanobar Omonliqovna'
  },
  { 
    email: 'yorqinjon@gmail.com', 
    role: 'Moliya-iqtisod ishlari bo’yicha prorektor',
    fullName: 'Rajabov Yorqinbek Sayfiddin o\'g\'li'
  },
  { 
    email: 'ochilovmahsud@gmail.com', 
    role: 'O\'quv ishlari bo\'yicha prorektor',
    fullName: 'Ochilov Makhsudjon Muradullayevich'
  }
];
