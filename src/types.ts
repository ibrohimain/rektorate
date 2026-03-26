export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  photoUrl?: string;
  phone1: string;
  phone2: string;
  workplace: string;
  address: string;
  position: string;
  bio: string;
  role: 'user' | 'admin';
  adminRole?: string;
  // Admin settings
  appointmentDuration?: 10 | 20 | 30;
  bufferTime?: 5 | 10;
  unavailableDates?: string[];
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  dateTime: string;
  duration: number;
  purpose: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
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
    email: 'yorqin101@gmail.com', 
    role: 'Moliya-iqtisod ishlari bo’yicha prorektor',
    fullName: 'Rajabov Yorqinbek Sayfiddin o\'g\'li'
  },
  { 
    email: 'maxsudjon@gmail.com', 
    role: 'O\'quv ishlari bo\'yicha prorektor',
    fullName: 'Ochilov Makhsudjon Muradullayevich'
  }
];
