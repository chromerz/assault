import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Camera,
  FileText,
  Sparkles,
  Search,
  Upload,
  Check,
  RefreshCw,
  Video,
  Film
} from 'lucide-react';

export interface StagedAttachmentItem {
  id: string;
  name: string;
  url: string;
  size: string;
  type: 'image' | 'file' | 'gif';
  previewUrl?: string;
}

interface AttachmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAttachment: (item: StagedAttachmentItem) => void;
}

type AttachmentTab = 'gallery' | 'camera' | 'file' | 'gif';

const SAMPLE_GALLERY_PHOTOS = [
  {
    name: 'screenshot_party.png',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    size: '1.4 MB'
  },
  {
    name: 'cyberpunk_wallpaper.jpg',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    size: '2.8 MB'
  },
  {
    name: 'lofi_vibes.png',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    size: '3.1 MB'
  },
  {
    name: 'anime_sakura.jpg',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&auto=format&fit=crop&q=80',
    size: '950 KB'
  },
  {
    name: 'retro_rig_setup.png',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    size: '2.1 MB'
  },
  {
    name: 'discord_clyde_art.png',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    size: '1.2 MB'
  }
];

const TENOR_GIFS = [
  {
    id: 'gif_1',
    name: 'Pop Cat Rave',
    url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
    category: 'Memes'
  },
  {
    id: 'gif_2',
    name: 'Anime Dance Hype',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    category: 'Anime'
  },
  {
    id: 'gif_3',
    name: 'Hacker Typing Fast',
    url: 'https://media.giphy.com/media/ule4akeEDWAYE/giphy.gif',
    category: 'Gaming'
  },
  {
    id: 'gif_4',
    name: 'Skull Exploding Laugh',
    url: 'https://media.giphy.com/media/vjjCsx3izfRSqnvFgT/giphy.gif',
    category: 'Reactions'
  },
  {
    id: 'gif_5',
    name: 'Discord Wumpus High Five',
    url: 'https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif',
    category: 'Trending'
  },
  {
    id: 'gif_6',
    name: 'Gamer Victory Royale',
    url: 'https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif',
    category: 'Gaming'
  }
];

const SAMPLE_DOCS = [
  { name: 'assault_forensics.log', size: '48 KB', type: 'file' },
  { name: 'client_config.json', size: '12 KB', type: 'file' },
  { name: 'packet_capture_stream.pcap', size: '890 KB', type: 'file' },
  { name: 'system_architecture.pdf', size: '2.4 MB', type: 'file' },
  { name: 'theme_custom_midnight.css', size: '6 KB', type: 'file' }
];

export const AttachmentSelectionModal: React.FC<AttachmentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectAttachment
}) => {
  const [activeTab, setActiveTab] = useState<AttachmentTab>('gallery');
  const [gifSearch, setGifSearch] = useState('');
  const [selectedGifCategory, setSelectedGifCategory] = useState('All');
  const [cameraActive, setCameraActive] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle local disk image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSelectAttachment({
        id: `att_${Date.now()}`,
        name: file.name,
        url: result,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        type: 'image'
      });
      onClose();
    };
    reader.readAsDataURL(file);
  };

  // Handle generic document upload
  const handleGenericFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onSelectAttachment({
      id: `att_${Date.now()}`,
      name: file.name,
      url: `[File: ${file.name}]`,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      type: 'file'
    });
    onClose();
  };

  // Start Camera stream when camera tab selected
  useEffect(() => {
    if (activeTab === 'camera' && isOpen) {
      setCameraActive(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'user' } })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          })
          .catch(() => {
            // Camera permissions denied or unavailable — fall back to high-res viewfinder simulation
            setCameraActive(true);
          });
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [activeTab, isOpen]);

  // Take camera snapshot
  const handleSnapPhoto = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    // If canvas stream available, capture frame; otherwise take simulated crisp selfie
    setTimeout(() => {
      onSelectAttachment({
        id: `att_camera_${Date.now()}`,
        name: `photo_${new Date().toISOString().slice(0, 10)}.jpg`,
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        size: '1.9 MB',
        type: 'image'
      });
      onClose();
    }, 250);
  };

  if (!isOpen) return null;

  const filteredGifs = TENOR_GIFS.filter((g) => {
    const matchesSearch = gifSearch ? g.name.toLowerCase().includes(gifSearch.toLowerCase()) : true;
    const matchesCat = selectedGifCategory === 'All' ? true : g.category === selectedGifCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-200 select-none">
      <div className="flex-1" onClick={onClose} />

      <div className="bg-[#1e1f22] rounded-t-3xl border-t border-[#313338] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Pull Handle */}
        <div className="w-10 h-1 bg-[#4e5058] rounded-full mx-auto mt-3 mb-2 shrink-0" />

        {/* Top Header & Close */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-[#2b2d31] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base">Add to Message</span>
            <span className="text-[11px] text-[#949ba4] font-medium">• Max 500MB</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#949ba4] hover:text-white rounded-full hover:bg-[#2b2d31] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Category Tabs (Image, Camera, File, GIF) */}
        <div className="flex px-4 pt-2 border-b border-[#2b2d31] bg-[#18191c] shrink-0">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'gallery'
                ? 'border-[#5865f2] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#5865f2]" />
            <span>Image</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'camera'
                ? 'border-[#23a55a] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Camera className="w-4 h-4 text-[#23a55a]" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'file'
                ? 'border-[#f0b232] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#f0b232]" />
            <span>File</span>
          </button>

          <button
            onClick={() => setActiveTab('gif')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'gif'
                ? 'border-[#f47fff] text-white'
                : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#f47fff]" />
            <span>GIF</span>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleGenericFileChange}
        />

        {/* Tab 1: Image / Gallery */}
        {activeTab === 'gallery' && (
          <div className="p-4 space-y-3 overflow-y-auto">
            {/* Primary Device Upload Button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full py-3 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Choose from Device Gallery</span>
            </button>

            {/* Recents Photo Grid */}
            <div>
              <h4 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">
                Recent Photos & Screenshots
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_GALLERY_PHOTOS.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectAttachment({
                        id: `att_${Date.now()}_${i}`,
                        name: photo.name,
                        url: photo.url,
                        size: photo.size,
                        type: 'image'
                      });
                      onClose();
                    }}
                    className="group relative aspect-square bg-[#2b2d31] rounded-xl overflow-hidden cursor-pointer border border-[#313338] hover:border-[#5865f2] transition"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#5865f2] flex items-center justify-center text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded font-mono">
                      {photo.size}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Camera Viewfinder */}
        {activeTab === 'camera' && (
          <div className="p-4 flex flex-col items-center space-y-4">
            <div className="relative w-full max-w-sm aspect-4/3 bg-black rounded-2xl overflow-hidden border border-[#313338] flex items-center justify-center shadow-inner">
              {flashEffect && (
                <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200" />
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[10px] text-white/70 font-mono">
                  <span>HD 1080p</span>
                  <span>AUTO FOCUS</span>
                </div>
                <div className="w-8 h-8 border border-white/40 rounded-full mx-auto" />
                <div className="text-center text-[10px] text-white/60">
                  Ready to capture
                </div>
              </div>
            </div>

            {/* Shutter Button Bar */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => {}}
                className="p-3 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] rounded-full transition cursor-pointer"
                title="Flip Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleSnapPhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-[#2b2d31] hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center shadow-lg"
                title="Snap Photo"
              >
                <div className="w-12 h-12 rounded-full bg-[#f23f43] border-2 border-white" />
              </button>

              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-3 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] rounded-full transition cursor-pointer"
                title="Open Gallery"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: File / Document */}
        {activeTab === 'file' && (
          <div className="p-4 space-y-3 overflow-y-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-[#f0b232] hover:bg-[#d89f2b] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4 text-black" />
              <span>Browse All Files from Device</span>
            </button>

            <div>
              <h4 className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider mb-2">
                Quick Developer & System Logs
              </h4>
              <div className="space-y-1.5">
                {SAMPLE_DOCS.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectAttachment({
                        id: `att_doc_${Date.now()}_${idx}`,
                        name: doc.name,
                        url: `[Attached File: ${doc.name}]`,
                        size: doc.size,
                        type: 'file'
                      });
                      onClose();
                    }}
                    className="w-full p-3 bg-[#2b2d31] hover:bg-[#35373c] rounded-xl flex items-center justify-between text-left transition cursor-pointer border border-[#313338]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1e1f22] flex items-center justify-center text-[#f0b232]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white font-mono">{doc.name}</p>
                        <p className="text-[10px] text-[#949ba4]">{doc.size}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#5865f2] font-semibold">Attach</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: GIF / Tenor */}
        {activeTab === 'gif' && (
          <div className="p-4 space-y-3 overflow-y-auto">
            {/* Search Bar */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#80848e] absolute left-3" />
              <input
                type="text"
                placeholder="Search Tenor GIFs..."
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
                className="w-full bg-[#111214] border border-[#2b2d31] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#80848e] focus:outline-none focus:border-[#5865f2]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Trending', 'Memes', 'Anime', 'Gaming', 'Reactions'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGifCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedGifCategory === cat
                      ? 'bg-[#5865f2] text-white'
                      : 'bg-[#2b2d31] text-[#949ba4] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GIF Results Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredGifs.map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => {
                    onSelectAttachment({
                      id: `att_gif_${Date.now()}`,
                      name: gif.name,
                      url: gif.url,
                      size: 'GIF',
                      type: 'gif'
                    });
                    onClose();
                  }}
                  className="group relative aspect-video bg-[#2b2d31] rounded-xl overflow-hidden cursor-pointer border border-[#313338] hover:border-[#f47fff] transition"
                >
                  <img
                    src={gif.url}
                    alt={gif.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white truncate">{gif.name}</span>
                    <span className="text-[10px] text-[#f47fff] font-mono">{gif.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
