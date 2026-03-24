/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Appointment, ADMIN_ACCOUNTS } from './types';
import { 
  LogOut, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Phone, 
  MapPin, 
  Briefcase, 
  Info,
  X,
  Plus,
  User as UserIcon,
  Download,
  BarChart3
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isValid, startOfDay, startOfMonth, startOfYear, isSameDay, isSameMonth, isSameYear } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const ReportsSection = ({ appointments }: { appointments: Appointment[] }) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  
  const completedAppointments = appointments.filter(a => a.status === 'completed' && isValid(parseISO(a.dateTime)));

  const getFilteredData = () => {
    const now = new Date();
    return completedAppointments.filter(a => {
      const date = parseISO(a.dateTime);
      if (reportType === 'daily') return isSameDay(date, now);
      if (reportType === 'monthly') return isSameMonth(date, now);
      if (reportType === 'yearly') return isSameYear(date, now);
      return false;
    });
  };

  const filteredData = getFilteredData();

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = reportType === 'daily' ? 'Kunlik qabul hisoboti' : 
                  reportType === 'monthly' ? 'Oylik qabul hisoboti' : 'Yillik qabul hisoboti';
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Sana: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 30);

    const tableData = filteredData.map(a => [
      format(parseISO(a.dateTime), 'dd.MM.yyyy HH:mm'),
      a.userName,
      a.adminName,
      a.purpose,
      a.phone
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Vaqt', 'Foydalanuvchi', 'Mas\'ul shaxs', 'Maqsad', 'Telefon']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 }
    });

    doc.save(`qabul_hisoboti_${reportType}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" />
            Qabul hisobotlari
          </h3>
          <p className="text-slate-500 text-sm">Tashrif buyurganlar bo'yicha statistik ma'lumotlar</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['daily', 'monthly', 'yearly'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  reportType === type ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {type === 'daily' ? 'Kunlik' : type === 'monthly' ? 'Oylik' : 'Yillik'}
              </button>
            ))}
          </div>
          <button 
            onClick={downloadPDF}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">Jami tashriflar</p>
          <p className="text-3xl font-black text-blue-900">{filteredData.length}</p>
        </div>
        <div className="md:col-span-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-medium">Foydalanuvchi</th>
                <th className="pb-3 font-medium">Mas'ul</th>
                <th className="pb-3 font-medium">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-bold text-slate-900">{a.userName}</td>
                  <td className="py-3 text-slate-600">{a.adminName.split(' ')[0]}</td>
                  <td className="py-3 text-slate-500">{format(parseISO(a.dateTime), 'dd.MM.yy')}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400 italic">Ma'lumot mavjud emas</td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredData.length > 5 && (
            <p className="text-xs text-slate-400 mt-2 text-center">Yana {filteredData.length - 5} ta ma'lumot PDF hisobotda mavjud</p>
          )}
        </div>
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium">Yuklanmoqda...</p>
    </div>
  </div>
);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if this is an admin account
        const adminInfo = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
        
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          fullName: adminInfo?.fullName || '',
          phone1: '',
          phone2: '',
          workplace: '',
          address: '',
          position: '',
          bio: '',
          role: adminInfo ? 'admin' : 'user',
          adminRole: adminInfo?.role || ''
        };
        
        await setDoc(doc(db, 'users', user.uid), profile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">JizPI Qabul</h1>
          <p className="text-slate-500">Rektor va prorektorlar qabuliga yozilish tizimi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Yuklanmoqda...' : (isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            {isLogin ? 'Yangi hisob ochish' : 'Tizimga kirish'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSetup = ({ profile, onComplete, onCancel }: { profile: UserProfile, onComplete: () => void, onCancel?: () => void }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), { ...formData });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Profilni tahrirlash</h2>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-slate-500 hover:text-slate-700 p-2"
          >
            Bekor qilish
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">F.I.SH (To'liq)</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asosiy telefon</label>
            <input 
              type="tel" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone1}
              onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Qo'shimcha telefon</label>
            <input 
              type="tel" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone2}
              onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ish yoki o'qish joyi</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.workplace}
              onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lavozimi</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Yashash manzili</label>
            <input 
              type="text" 
              required 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">O'zingiz haqingizda (Bio)</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Saqlanmoqda...' : 'Saqlash va davom etish'}
        </button>
      </form>
    </div>
  );
};

const AppointmentModal = ({ isOpen, onClose, admins, userProfile }: { 
  isOpen: boolean, 
  onClose: () => void, 
  admins: UserProfile[],
  userProfile: UserProfile | null
}) => {
  const [adminId, setAdminId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile && isOpen) {
      setPhone(userProfile.phone1 || '');
    }
  }, [userProfile, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminId || !dateTime || !purpose || !phone) return;

    setLoading(true);
    const selectedAdmin = admins.find(a => a.uid === adminId);
    
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: userProfile.uid,
        userName: userProfile.fullName,
        adminId,
        adminName: selectedAdmin?.fullName || '',
        adminRole: selectedAdmin?.adminRole || '',
        dateTime,
        purpose,
        phone,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Qabulga yozilish</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rektor yoki Prorektor</label>
            <select 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            >
              <option value="">Tanlang...</option>
              {admins.map(admin => (
                <option key={admin.uid} value={admin.uid}>
                  {admin.fullName} - {admin.adminRole}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vaqt</label>
            <input 
              type="datetime-local" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam</label>
            <input 
              type="tel" 
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Murojaat maqsadi</label>
            <textarea 
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Murojaatingiz mazmunini qisqacha yozing..."
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Bekor qilish
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const UserProfileView = ({ user, onClose }: { user: UserProfile, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900">Foydalanuvchi profili</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">F.I.SH</label>
              <p className="text-lg font-semibold text-slate-900">{user.fullName || 'Kiritilmagan'}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lavozimi</label>
              <p className="text-slate-700 flex items-center gap-2">
                <Briefcase size={16} className="text-slate-400" />
                {user.position || 'Kiritilmagan'}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ish/O'qish joyi</label>
              <p className="text-slate-700">{user.workplace || 'Kiritilmagan'}</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefonlar</label>
              <div className="space-y-1">
                <p className="text-slate-700 flex items-center gap-2">
                  <Phone size={16} className="text-slate-400" />
                  {user.phone1}
                </p>
                {user.phone2 && (
                  <p className="text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" />
                    {user.phone2}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manzil</label>
              <p className="text-slate-700 flex items-center gap-2">
                <MapPin size={16} className="text-slate-400" />
                {user.address || 'Kiritilmagan'}
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio</label>
            <p className="text-slate-700 bg-slate-50 p-4 rounded-xl italic">
              "{user.bio || 'Ma\'lumot yo\'q'}"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AppointmentCard = ({ 
  appointment, 
  isAdmin, 
  onAction,
  onViewUser
}: { 
  appointment: Appointment, 
  isAdmin: boolean,
  onAction?: (id: string, status: string, newTime?: string) => void,
  onViewUser?: (userId: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTime, setNewTime] = useState(appointment.dateTime);

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const statusLabels = {
    pending: 'Kutilmoqda',
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    completed: 'Yakunlangan'
  };

  const date = parseISO(appointment.dateTime);
  const isValidDate = isValid(date);
  const dateStr = isValidDate 
    ? (isToday(date) ? 'Bugun' : isTomorrow(date) ? 'Ertaga' : format(date, 'dd.MM.yyyy'))
    : 'Noma\'lum sana';
  const timeStr = isValidDate ? format(date, 'HH:mm') : '--:--';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", statusColors[appointment.status])}>
              {statusLabels[appointment.status]}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <Clock size={14} />
              {dateStr}, {timeStr}
            </div>
          </div>

          <h4 className="text-lg font-bold text-slate-900 mb-1">
            {isAdmin ? appointment.userName : appointment.adminName}
          </h4>
          <p className="text-sm text-slate-500 mb-4">
            {isAdmin ? 'Murojaatchi' : appointment.adminRole}
          </p>

          <div className="bg-slate-50 p-4 rounded-xl mb-4">
            <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Maqsad:</p>
            <p className="text-slate-700 text-sm leading-relaxed">{appointment.purpose}</p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <Phone size={14} />
                {appointment.phone}
              </div>
              <button 
                onClick={() => onViewUser?.(appointment.userId)}
                className="text-blue-600 hover:underline font-medium flex items-center gap-1"
              >
                Profilni ko'rish <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {isAdmin && appointment.status === 'pending' && (
          <div className="flex flex-col gap-2 min-w-[160px]">
            {isEditing ? (
              <div className="space-y-2">
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      onAction?.(appointment.id, 'approved', newTime);
                      setIsEditing(false);
                    }}
                    className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg"
                  >
                    Saqlash
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-lg"
                  >
                    X
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => onAction?.(appointment.id, 'approved')}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 rounded-lg transition-colors"
                >
                  <CheckCircle size={16} /> Tasdiqlash
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-bold py-2 rounded-lg transition-colors"
                >
                  <Clock size={16} /> Vaqtni o'zgartirish
                </button>
                <button 
                  onClick={() => onAction?.(appointment.id, 'rejected')}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold py-2 rounded-lg transition-colors"
                >
                  <XCircle size={16} /> Rad etish
                </button>
              </>
            )}
          </div>
        )}

        {isAdmin && appointment.status === 'approved' && (
          <button 
            onClick={() => onAction?.(appointment.id, 'completed')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Yakunlash
          </button>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If profile doesn't exist, create a skeleton
          const adminInfo = ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === u.email?.toLowerCase());
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email!,
            fullName: adminInfo?.fullName || '',
            phone1: '',
            phone2: '',
            workplace: '',
            address: '',
            position: '',
            bio: '',
            role: adminInfo ? 'admin' : 'user',
            adminRole: adminInfo?.role || ''
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    const q = profile.role === 'admin' 
      ? query(collection(db, 'appointments'), where('adminId', '==', user.uid))
      : query(collection(db, 'appointments'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      
      // Sort in memory to avoid composite index requirement
      const sortedApps = apps.sort((a, b) => {
        const dateA = new Date(a.dateTime).getTime();
        const dateB = new Date(b.dateTime).getTime();
        return profile.role === 'admin' ? dateA - dateB : dateB - dateA;
      });
      
      setAppointments(sortedApps);
    });

    return unsubscribe;
  }, [user, profile]);

  useEffect(() => {
    if (!user || profile?.role === 'admin') return;
    
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminList = snapshot.docs.map(doc => doc.data() as UserProfile);
      setAdmins(adminList);
    });

    return unsubscribe;
  }, [user, profile]);

  const handleAppointmentAction = async (id: string, status: string, newTime?: string) => {
    try {
      const updateData: any = { 
        status, 
        updatedAt: new Date().toISOString() 
      };
      if (newTime) updateData.dateTime = newTime;
      
      await updateDoc(doc(db, 'appointments', id), updateData);
    } catch (err) {
      console.error(err);
    }
  };

  const viewUserProfile = async (userId: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        setSelectedUser(docSnap.data() as UserProfile);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingScreen />;

  if (!user) return <AuthPage />;

  if (profile && (!profile.fullName || isEditingProfile)) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <ProfileSetup 
          profile={profile} 
          onComplete={() => {
            setIsEditingProfile(false);
            window.location.reload();
          }} 
          onCancel={profile.fullName ? () => setIsEditingProfile(false) : undefined}
        />
      </div>
    );
  }

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status === filter);

  const nextAppointment = appointments.find(a => {
    const d = parseISO(a.dateTime);
    return a.status === 'approved' && isValid(d) && d > new Date();
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Calendar size={20} />
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:block">JizPI Qabul</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Profilni tahrirlash"
              >
                <UserIcon size={20} />
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{profile?.fullName}</p>
                <p className="text-xs text-slate-500">{profile?.role === 'admin' ? profile.adminRole : 'Foydalanuvchi'}</p>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Chiqish"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reports Section for Admins */}
        {profile?.role === 'admin' && (
          <ReportsSection appointments={appointments} />
        )}

        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-blue-200">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Assalomu alaykum, {profile?.fullName.split(' ')[0]}!</h2>
              <p className="text-blue-100 max-w-md">
                {profile?.role === 'admin' 
                  ? "Bugungi qabul jarayonlarini boshqarishingiz mumkin. Barcha murojaatlar shu yerda jamlangan."
                  : "Rektor va prorektorlar qabuliga onlayn navbat oling va uchrashuvlaringizni kuzatib boring."}
              </p>
              {profile?.role === 'user' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
                >
                  <Plus size={20} /> Navbatga yozilish
                </button>
              )}
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Keyingi uchrashuv
            </h3>
            {nextAppointment && isValid(parseISO(nextAppointment.dateTime)) ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 font-bold text-center min-w-[60px]">
                    <span className="block text-xs uppercase">{format(parseISO(nextAppointment.dateTime), 'MMM')}</span>
                    <span className="text-2xl">{format(parseISO(nextAppointment.dateTime), 'dd')}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{profile?.role === 'admin' ? nextAppointment.userName : nextAppointment.adminName}</p>
                    <p className="text-sm text-slate-500">{format(parseISO(nextAppointment.dateTime), 'HH:mm')}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600">
                  <p className="font-bold text-xs uppercase text-slate-400 mb-1">Maqsad:</p>
                  <p className="line-clamp-2 italic">"{nextAppointment.purpose}"</p>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Info size={32} strokeWidth={1.5} />
                <p className="text-sm font-medium">Hozircha uchrashuvlar yo'q</p>
              </div>
            )}
          </div>
        </div>

        {/* Filters & List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">
              {profile?.role === 'admin' ? 'Kelib tushgan murojaatlar' : 'Mening arizalarim'}
            </h3>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
              {(['all', 'pending', 'approved', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    filter === f ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {f === 'all' ? 'Barchasi' : f === 'pending' ? 'Kutilmoqda' : f === 'approved' ? 'Tasdiqlangan' : 'Yakunlangan'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <motion.div
                    key={app.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <AppointmentCard 
                      appointment={app} 
                      isAdmin={profile?.role === 'admin'} 
                      onAction={handleAppointmentAction}
                      onViewUser={viewUserProfile}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Ma'lumot topilmadi</h4>
                  <p className="text-slate-500">Ushbu bo'limda hozircha hech qanday ariza mavjud emas.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        admins={admins}
        userProfile={profile}
      />

      {selectedUser && (
        <UserProfileView 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}
