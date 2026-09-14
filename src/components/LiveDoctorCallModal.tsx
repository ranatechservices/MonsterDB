import React, { useState } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Shield, MessageSquare } from 'lucide-react';
import { Doctor } from '../types';

interface LiveDoctorCallModalProps {
  doctor: Doctor;
  onEndCall: () => void;
}

export default function LiveDoctorCallModal({ doctor, onEndCall }: LiveDoctorCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center font-bold">
            {doctor.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">{doctor.name}</h3>
            <p className="text-xs text-emerald-400">{doctor.specialty} • Live Consultation</p>
          </div>
        </div>

        <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>04:12</span>
        </div>
      </div>

      {/* Main Video View */}
      <div className="flex-1 my-6 relative rounded-3xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center">
        <img
          src={doctor.avatarUrl}
          alt={doctor.name}
          className="w-full h-full object-cover max-h-[60vh] opacity-90"
        />

        {/* Self Video PiP */}
        <div className="absolute bottom-4 right-4 w-32 sm:w-44 h-24 sm:h-32 bg-slate-800 rounded-2xl border-2 border-emerald-500/50 overflow-hidden shadow-2xl flex items-center justify-center">
          {isVideoOff ? (
            <span className="text-xs text-slate-400">Camera Off</span>
          ) : (
            <div className="text-center">
              <span className="text-xs text-emerald-400 font-bold block">Patient Camera</span>
              <span className="text-[10px] text-slate-400">HD 1080p</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-2xl transition-colors ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`p-4 rounded-2xl transition-colors ${
            isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
          title={isVideoOff ? 'Turn on video' : 'Turn off video'}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          onClick={onEndCall}
          className="px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-lg"
        >
          <PhoneOff className="w-6 h-6" />
          <span>End Consultation</span>
        </button>
      </div>
    </div>
  );
}
