import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { sounds } from '../utils/audio';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : `https://snakesandladders.app/?room=${roomId}`;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-center">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
          <div className="flex items-center gap-2 font-bold text-white uppercase text-sm">
            <QrCode className="w-5 h-5 text-amber-400" />
            <span>JOIN MATCH QR CODE</span>
          </div>
          <button
            id="close-qr-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-slate-700 shadow-inner">
          <QRCodeSVG value={joinUrl} size={200} level="H" includeMargin />
        </div>

        <div className="bg-slate-950 p-3 rounded-2xl font-mono text-center border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            MATCH CODE
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-widest">
            {roomId}
          </div>
        </div>

        <button
          id="copy-qr-url-btn"
          type="button"
          onClick={handleCopy}
          className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-slate-950 font-black uppercase tracking-tight rounded-xl flex items-center justify-center gap-2 shadow-lg"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'LINK COPIED TO CLIPBOARD!' : 'COPY MATCH LINK'}</span>
        </button>
      </div>
    </div>
  );
};
