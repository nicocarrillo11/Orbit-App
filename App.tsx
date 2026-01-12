import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Disc, List, Grid, Settings, 
  Ghost, Volume2, Mic, X, Search 
} from 'lucide-react';

// --- Utilities ---
const getContrastColor = (hex) => {
  if (!hex || hex.length < 6) return '#ffffff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

const MOCK_TRACKS = [
  "Visions - Grimes",
  "Solitude - M83",
  "Atmosphere - Joy Division",
  "Windowlicker - Aphex Twin",
  "Selected Ambient Works - Autechre"
];

const MOCK_POSTS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  image: `https://picsum.photos/seed/${i + 42}/800/800`,
  handle: 'null_pointer',
  timestamp: Date.now() - Math.random() * 86400000,
  caption: "The architecture of silence is often louder than the noise of the crowd. We build grids to hide the void."
}));

const MOCK_MESSAGES = [
  { id: 1, handle: 'void_walker', text: "Did you see the light hit the concrete today?", time: "14:02", unread: true, voice: true },
  { id: 2, handle: 'arch_mask', text: "The grid is shifting. 16 slots remaining.", time: "09:15", unread: false, voice: false },
];

export default function OrbitApp() {
  const [view, setView] = useState('orbit');
  const [outerOrbit, setOuterOrbit] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [pingUsed, setPingUsed] = useState(false);
  const [gravitySnapping, setGravitySnapping] = useState(false);
  const [coreLayout, setCoreLayout] = useState('4x4');

  // Customization State
  const [theme, setTheme] = useState({
    bg: '#000000',
    texture: 'none', 
  });

  // Derived dynamic text color for accessibility
  const dynamicTextColor = useMemo(() => getContrastColor(theme.bg), [theme.bg]);

  const [corePosts, setCorePosts] = useState(MOCK_POSTS);

  const containerStyle = {
    backgroundColor: theme.bg,
    color: dynamicTextColor,
    fontFamily: 'monospace',
    filter: outerOrbit ? 'invert(1)' : 'none',
  };

  return (
    <div style={containerStyle} className="min-h-screen transition-colors duration-700 relative overflow-x-hidden selection:bg-red-500">
      {/* Texture Overlays */}
      {(outerOrbit || theme.texture === 'grain') && (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.05] contrast-150 brightness-100">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>
      )}
      {theme.texture === 'concrete' && (
        <div className="fixed inset-0 pointer-events-none z-40 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/concrete-wall.png')]" />
      )}

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-40 border-b border-current p-4 flex justify-between items-center backdrop-blur-sm">
        <h1 className="text-xl tracking-tighter font-bold cursor-pointer" onClick={() => setView('orbit')}>ORBIT</h1>
        <div className="flex gap-6 items-center">
          <button onClick={() => setPingUsed(true)} className="hover:opacity-50 transition-opacity">
            {pingUsed ? <div className="flex items-center gap-2 text-[10px] opacity-50"><Ghost size={12}/> 23:59:51</div> : <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"/>}
          </button>
          <button onClick={() => setOuterOrbit(!outerOrbit)} className="text-[10px] border border-current px-2 py-0.5 uppercase tracking-widest">
            {outerOrbit ? 'Inner Orbit' : 'Outer Orbit'}
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-32 max-w-2xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {view === 'orbit' ? (
            <OrbitFeed 
              posts={corePosts} 
              outerOrbit={outerOrbit} 
              onSnap={() => {
                setGravitySnapping(true);
                setTimeout(() => { setGravitySnapping(false); setView('atmosphere'); window.scrollTo(0, 0); }, 3000);
              }}
            />
          ) : (
            <Atmosphere 
              posts={corePosts} 
              layout={coreLayout} 
              setLayout={setCoreLayout} 
              setTheme={setTheme}
              theme={theme}
              textColor={dynamicTextColor}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Gravity Snap Overlay */}
      <AnimatePresence>
        {gravitySnapping && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-center p-10"
          >
            <p className="text-white text-sm tracking-widest leading-loose uppercase">
              Your orbit looped 12 times now.<br/>Come back later.
            </p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 3, ease: "linear" }} className="w-32 h-[1px] bg-white mt-8" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Trigger */}
      <button 
        onClick={() => setIsPosting(true)}
        className="fixed bottom-8 right-8 z-40 w-12 h-12 flex items-center justify-center border border-current rounded-full bg-inherit hover:scale-110 transition-transform"
      >
        <Plus size={20} />
      </button>

      <AnimatePresence>
        {isPosting && (
          <PostingUI onClose={() => setIsPosting(false)} onSubmit={(p) => { setCorePosts([p, ...corePosts].slice(0, 16)); setIsPosting(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

function OrbitFeed({ posts, outerOrbit, onSnap }) {
  useEffect(() => {
    const handleScroll = () => {
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 20;
      if (bottom) onSnap();
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onSnap]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-32">
      {posts.map((post) => (
        <div key={post.id} className="relative">
          <div className="aspect-square w-full bg-neutral-900 relative">
            <img src={post.image} alt="" className="w-full h-full object-cover grayscale" />
            <div className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-neutral-800">
              <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 10, ease: "linear" }} className="h-full bg-current origin-left" />
            </div>
          </div>
          <div className="mt-6 flex justify-between items-baseline text-[10px] uppercase tracking-widest opacity-70">
            {outerOrbit ? <span>[Pic] via @{post.handle}</span> : <span>@{post.handle}</span>}
            <span>{new Date(post.timestamp).getHours()}h ago</span>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function Atmosphere({ posts, layout, setLayout, setTheme, theme, textColor }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-20">
      <Anthem textColor={textColor} />

      <div className="flex gap-6 border-b border-current pb-4">
        <button onClick={() => setLayout('4x4')} className={layout === '4x4' ? 'opacity-100' : 'opacity-30'}><Grid size={18}/></button>
        <button onClick={() => setLayout('list')} className={layout === 'list' ? 'opacity-100' : 'opacity-30'}><List size={18}/></button>
      </div>

      <div className={layout === '4x4' ? 'grid grid-cols-4 gap-1' : 'space-y-12'}>
        {posts.map(post => (
          <div key={post.id} className={layout === 'list' ? 'flex gap-6 items-start' : ''}>
            <div className={`bg-neutral-900 border border-current/10 ${layout === 'list' ? 'w-[75px] h-[75px] flex-shrink-0' : 'aspect-square'}`}>
              <img src={post.image} alt="" className="w-full h-full object-cover grayscale" />
            </div>
            {layout === 'list' && (
              <div className="flex-1 space-y-1">
                <span className="text-[9px] block opacity-40 uppercase tracking-tighter">@{post.handle} // fragment_{post.id}</span>
                <p className="text-[12px] leading-relaxed max-w-[100ch] opacity-90">{post.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-10 border-t border-current space-y-8">
        {MOCK_MESSAGES.map(msg => (
          <div key={msg.id} className="flex gap-4 items-start text-[11px]">
            {msg.unread && <div className="w-[3px] h-[3px] bg-red-600 mt-1.5 flex-shrink-0" />}
            <div className="flex flex-col gap-1">
              <span className="opacity-40 tracking-tighter">[{msg.time}] @{msg.handle}</span>
              {msg.voice ? <VoiceFragment /> : <span className="max-w-md">{msg.text}</span>}
            </div>
          </div>
        ))}
      </div>

      <SettingsPanel setTheme={setTheme} theme={theme} textColor={textColor} />
    </motion.div>
  );
}

function Anthem({ textColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [currentTrack, setCurrentTrack] = useState('Silent Orbit');

  const results = search ? MOCK_TRACKS.filter(t => t.toLowerCase().includes(search.toLowerCase())) : [];

  return (
    <div className="relative flex items-center gap-4">
      <motion.button 
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        onClick={() => { setIsOpen(!isOpen); setIsPlaying(true); }}
        className="text-2xl"
      >
        💿
      </motion.button>
      
      <div className="text-[10px] uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap border-l border-current pl-4">
        {isPlaying ? `Playing: ${currentTrack}` : 'System Mute'}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="absolute left-0 top-10 p-6 border border-current bg-inherit z-50 w-80 shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-current pb-2 mb-4">
              <Search size={14} className="opacity-40" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search Frequencies..." 
                className="bg-transparent w-full outline-none text-[10px] uppercase"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {results.map((track) => (
                <button 
                  key={track}
                  onClick={() => { setCurrentTrack(track); setIsOpen(false); setSearch(''); }}
                  className="w-full text-left text-[10px] hover:bg-current hover:text-black p-2 transition-colors uppercase"
                >
                  {track}
                </button>
              ))}
              {search && results.length === 0 && <p className="text-[9px] opacity-30 p-2">No signals found.</p>}
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} className="mt-4 w-full border border-current py-2 text-[10px] uppercase">
              {isPlaying ? 'Stop Transmission' : 'Resume'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VoiceFragment() {
  const [active, setActive] = useState(false);
  return (
    <button 
      onMouseDown={() => setActive(true)} onMouseUp={() => setActive(false)}
      className="flex items-center gap-3 border border-current px-3 py-2 text-[10px] hover:bg-current hover:text-black transition-all w-fit"
    >
      <Mic size={12} /> {active ? 'RECEIVING FRAGMENT...' : '15S FRAGMENT (HOLD)'}
    </button>
  );
}

function SettingsPanel({ setTheme, theme, textColor }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="py-20 border-t border-current">
      <button 
        onClick={() => setOpen(!open)} 
        style={{ color: textColor }}
        className="flex items-center gap-2 text-[10px] hover:opacity-50 transition-opacity uppercase tracking-widest"
      >
        <Settings size={14} /> Terminal Configuration
      </button>

      {open && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-12 text-[10px] overflow-hidden">
          <div className="space-y-6">
            <p className="opacity-40">// HEX_SPECTRUM</p>
            <div className="flex gap-8 items-center">
              <div className="flex flex-col gap-2">
                <span>Background</span>
                <input 
                  type="color" 
                  value={theme.bg} 
                  onChange={(e) => setTheme({...theme, bg: e.target.value})} 
                  className="w-12 h-12 bg-transparent border border-current cursor-crosshair" 
                />
              </div>
              <div className="flex flex-col gap-2 opacity-50">
                <span>Auto-Text</span>
                <div className="w-12 h-12 border border-current flex items-center justify-center font-bold" style={{ backgroundColor: textColor, color: theme.bg }}>
                  Aa
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <p className="opacity-40">// TEXTURE_MAP</p>
            <div className="flex flex-wrap gap-2">
              {['none', 'concrete', 'grain'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTheme({...theme, texture: t})}
                  className={`border border-current px-4 py-2 uppercase tracking-tighter ${theme.texture === t ? 'bg-current' : ''}`}
                  style={{ color: theme.texture === t ? theme.bg : textColor }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PostingUI({ onClose, onSubmit }) {
  const [caption, setCaption] = useState('');
  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-0 z-[60] bg-black text-white p-8 flex flex-col">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onClose}><X size={24} /></button>
        <button 
          onClick={() => onSubmit({ id: Date.now(), image: `https://picsum.photos/seed/${Math.random()}/800/800`, handle: 'curator', timestamp: Date.now(), caption })}
          className="uppercase tracking-widest text-xs border border-white px-4 py-1"
        >
          Eject to Core
        </button>
      </div>
      <div className="aspect-square w-full max-w-md mx-auto border border-white/20 relative flex items-center justify-center">
        <div className="absolute inset-4 border border-white/5" />
        <span className="text-[10px] opacity-30 uppercase tracking-[1em]">Viewfinder</span>
      </div>
      <div className="max-w-md mx-auto w-full mt-8">
        <textarea 
          maxLength={100}
          autoFocus
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="ENTER CATALOG DESCRIPTION..."
          className="bg-transparent border-none outline-none resize-none w-full h-20 text-[12px] uppercase tracking-widest leading-loose"
        />
        <div className="w-full h-[1px] bg-white/10 mt-4 overflow-hidden">
          <motion.div className="h-full bg-white" animate={{ width: `${caption.length}%` }} />
        </div>
      </div>
    </motion.div>
  );
}
