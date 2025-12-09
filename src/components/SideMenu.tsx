import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Transition } from '@headlessui/react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onLogout, onOpenSettings, onOpenBackup }) => {
  const [leftOffset, setLeftOffset] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const el = document.getElementById('content-root');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setLeftOffset(rect.left);
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, true);
    };
  }, []);

  // Also recalc offset when the menu opens to capture any layout shifts
  useLayoutEffect(() => {
    if (!isOpen) return;
    const el = document.getElementById('content-root');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setLeftOffset(rect.left);
  }, [isOpen]);

  return createPortal(
    <Transition show={isOpen} as="div" className="fixed inset-0 z-50">
      {/* Backdrop */}
      <Transition.Child
        as="div"
        enter="transition-opacity ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="fixed inset-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />
      </Transition.Child>

      {/* Panel */}
      {leftOffset !== null && (
        <div
          className="fixed top-0 bottom-0 w-64 overflow-hidden"
          style={{ left: leftOffset }}
        >
          <Transition.Child
            as="div"
            enter="transition transform ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition transform ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
            className="w-64 h-full bg-[var(--card-bg)] shadow-xl p-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="text-[rgb(var(--text-white))] font-semibold">Menu</div>
              <button onClick={onClose} className="text-[rgb(var(--text-white))] opacity-75 hover:opacity-100" aria-label="Close">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <nav className="space-y-2">
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]"
                onClick={() => { onOpenBackup(); onClose(); }}
              >
                Backup
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]"
                onClick={() => { onOpenSettings(); onClose(); }}
              >
                Settings
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-[rgb(var(--card-border))] text-[rgb(var(--text-white))]"
                onClick={() => { onClose(); onLogout(); }}
              >
                Logout
              </button>
            </nav>
          </Transition.Child>
        </div>
      )}
    </Transition>,
    document.body
  );
};

export default SideMenu;
