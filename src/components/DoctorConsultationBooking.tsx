import React, { useState, useEffect, useMemo } from 'react';
import { Stethoscope, Star, Calendar, Clock, Video, CheckCircle2, Search, Filter, ShieldCheck, UserPlus, RefreshCw } from 'lucide-react';
import { Doctor } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function DoctorConsultationBooking({
  onBooked,
  onNavigateAdmin
}: {
  onBooked?: () => void;
  onNavigateAdmin?: () => void;
}) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const isAdmin = Boolean(
    user && (user.role === 'super_admin' || user.role === 'hospital_admin')
  );

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.doctors.getAll();
      if (Array.isArray(data)) {
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      console.warn('Failed to load doctors from backend:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();

    // Subscribe to realtime backend doctor updates
    const unsub = api.realtime.subscribe((event) => {
      if (event && event.entity === 'doctors') {
        loadDoctors();
      }
    });

    const eventBusUnsub = HealthEventBus.on('doctors_updated', loadDoctors);

    return () => {
      unsub();
      eventBusUnsub();
    };
  }, []);

  // Dynamically extract unique specialties from available doctors
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = doctors.filter((doc) => {
    const matchSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
      (doc.hospital && doc.hospital.toLowerCase().includes(search.toLowerCase()));
    const matchSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  });

  const handleConfirmBooking = () => {
    if (!selectedDoctor || !selectedSlot) return;

    dataManager.saveAppointment({
      id: 'apt_booked_' + Date.now(),
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      hospitalName: selectedDoctor.hospital || 'Healora Telehealth Network',
      date: selectedDate,
      time: selectedSlot,
      type: 'video_call',
      status: 'upcoming',
      notes: `Video Consultation with ${selectedDoctor.name} (${selectedDoctor.qualification || selectedDoctor.specialty})`,
      fee: selectedDoctor.consultationFee || 500
    });

    HealthEventBus.emit('appointments_updated');
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedDoctor(null);
      onBooked?.();
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-emerald-500" />
            Book Doctor Consultation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time licensed specialist appointments configured and credentialed by the Medical Administrator
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDoctors}
            className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Doctor List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="doctor-search-input"
            type="text"
            placeholder="Search doctors by name, specialty, or hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <select
          id="specialty-filter-select"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="All">All Specialties ({doctors.length})</option>
          {availableSpecialties.map((spec) => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && doctors.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Loading live doctor profiles...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        /* Empty State */
        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center space-y-4 bg-white dark:bg-slate-800">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {doctors.length === 0 ? 'No Doctor Profiles Registered Yet' : 'No Doctors Match Search'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {doctors.length === 0
                ? 'Only doctor profiles registered and credentialed by the Administrator from the Admin Panel appear here for consultation booking.'
                : `Try adjusting your search filter "${search || selectedSpecialty}".`}
            </p>
          </div>

          {isAdmin && doctors.length === 0 && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateAdmin ? onNavigateAdmin() : HealthEventBus.emit('navigate_tab', 'admin')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Go to Admin Panel & Add Doctor Profile</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Doctor Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
                    alt={doc.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{doc.name}</span>
                    </h3>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-400">{doc.qualification || 'MBBS, MD'}</p>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{doc.rating || 4.9}</span>
                      <span className="text-slate-400 text-[10px]">({doc.reviewCount || 100} reviews)</span>
                    </div>
                  </div>
                </div>

                {doc.about && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                    {doc.about}
                  </p>
                )}

                <div className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl">
                  <div>Hospital: <strong className="text-slate-700 dark:text-slate-300">{doc.hospital || 'Hospital Partner'}</strong></div>
                  <div>Experience: <strong className="text-slate-700 dark:text-slate-300">{doc.experience || 5}+ Years</strong></div>
                  {doc.languages && doc.languages.length > 0 && (
                    <div>Languages: <span className="text-slate-600 dark:text-slate-400">{doc.languages.join(', ')}</span></div>
                  )}
                </div>

                {/* Available Days */}
                {doc.availableDays && doc.availableDays.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 font-medium mr-1 self-center">Days:</span>
                    {doc.availableDays.map((d) => (
                      <span key={d} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Consultation Fee</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">₹{doc.consultationFee || 500}</span>
                </div>
                <button
                  id={`book-doc-${doc.id}`}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setSelectedSlot(doc.availableSlots?.[0] || '10:00 AM');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Consultation Confirmed!</h3>
                <p className="text-xs text-slate-500 mt-1">Video appointment scheduled with {selectedDoctor.name}.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Schedule Video Consultation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{selectedDoctor.name} ({selectedDoctor.specialty}) • {selectedDoctor.hospital}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Consultation Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Available Time Slot</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {(selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0
                        ? selectedDoctor.availableSlots
                        : ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM']
                      ).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            selectedSlot === slot
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center">
                    <span>Telehealth Fee:</span>
                    <strong className="text-slate-900 dark:text-white text-base">₹{selectedDoctor.consultationFee || 500}</strong>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(null)}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-booking-submit-btn"
                      type="button"
                      onClick={handleConfirmBooking}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm cursor-pointer"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
