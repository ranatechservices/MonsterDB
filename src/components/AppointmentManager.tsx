import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, User, Plus, Trash2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { Appointment } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import { useLanguage } from '../localization/language_context';

export default function AppointmentManager({ onOpenBooking }: { onOpenBooking?: () => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('Cardiologist');
  const [hospitalName, setHospitalName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:30 AM');
  const [type, setType] = useState<Appointment['type']>('video_call');
  const [notes, setNotes] = useState('');
  const { t } = useLanguage();

  const loadAppointments = () => {
    setAppointments(dataManager.getAppointments());
  };

  useEffect(() => {
    loadAppointments();
    const unsub = HealthEventBus.on('appointments_updated', loadAppointments);
    return () => unsub();
  }, []);

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: Appointment = {
      id: 'apt_' + Date.now(),
      doctorName,
      specialty,
      hospitalName: hospitalName || 'Healora Telehealth Center',
      date,
      time,
      type,
      status: 'upcoming',
      notes,
      fee: 800
    };

    dataManager.saveAppointment(newAppt);
    HealthEventBus.emit('appointments_updated');
    loadAppointments();
    setShowAddModal(false);
    setDoctorName('');
    setNotes('');
  };

  const handleDelete = (id: string) => {
    dataManager.deleteAppointment(id);
    HealthEventBus.emit('appointments_updated');
    loadAppointments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-500" />
            {t.nav.appointments}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage scheduled doctor consultations, video calls, and in-clinic appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-sm font-semibold rounded-xl transition-all"
            >
              Browse Doctor Catalog
            </button>
          )}
          <button
            id="add-appointment-btn"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule Custom Visit
          </button>
        </div>
      </div>

      {/* Appointment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                  apt.type === 'video_call'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                }`}>
                  {apt.type === 'video_call' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {(apt.type || 'consultation').replace(/_/g, ' ')}
                </span>

                <button
                  id={`delete-apt-${apt.id}`}
                  onClick={() => handleDelete(apt.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{apt.doctorName}</h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{apt.specialty}</p>
              <p className="text-xs text-slate-500 mt-1">{apt.hospitalName}</p>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span>{apt.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>{apt.time}</span>
                </div>
              </div>

              {apt.notes && (
                <p className="mt-3 text-xs italic text-slate-500">"{apt.notes}"</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fee: ₹{apt.fee || 800}</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Confirmed
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Schedule Consultation</h3>
            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Doctor Name</label>
                <input
                  id="doctor-name-input"
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Specialty</label>
                  <select
                    id="doctor-specialty-select"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Format</label>
                  <select
                    id="appointment-type-select"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="video_call">Video Call (Telehealth)</option>
                    <option value="in_person">In-Person Clinic</option>
                    <option value="telephonic">Phone Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    id="appointment-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Time Slot</label>
                  <input
                    id="appointment-time-input"
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hospital or Clinic Name</label>
                <input
                  id="hospital-name-input"
                  type="text"
                  placeholder="e.g. Apollo Telehealth Wing"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-appointment-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
