import { useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import { SavedSnapsList } from '../SavedSnaps/SavedSnapsList';
import {
  buildShareUrl,
  exportMixesJson,
  importMixesJson,
  snapshotFromLiveMix,
} from '../../utils/mixShare';
import './styles.css';

export function MixesSheet() {
  const {
    savedSnaps,
    setSavedSnaps,
    mixesSheetOpen,
    setMixesSheetOpen,
    snapshotMix,
    setNotification,
  } = useContext(Context);
  const closeButtonRef = useRef(null);
  const importInputRef = useRef(null);

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  useEffect(() => {
    if (!mixesSheetOpen) return;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setMixesSheetOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mixesSheetOpen, setMixesSheetOpen]);

  const notify = (message, ms = 3000) => {
    setNotification({ message });
    setTimeout(() => setNotification(null), ms);
  };

  const handleShareCurrent = async () => {
    const snapshot = snapshotFromLiveMix(snapshotMix, 'Shared mix');
    if (!snapshot.players.length) {
      notify('Play something before sharing a mix.');
      return;
    }
    const url = buildShareUrl(snapshot);
    try {
      if (navigator.share) {
        await navigator.share({ title: snapshot.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        notify('Share link copied to clipboard');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        notify('Share link copied to clipboard');
      } catch {
        notify('Could not copy share link');
      }
    }
  };

  const handleExport = () => {
    if (snapCount === 0) {
      notify('No saved mixes to export.');
      return;
    }
    const blob = new Blob([exportMixesJson(savedSnaps)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ambient-architect-mixes.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('Mixes exported');
  };

  const handleImportFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const mixes = importMixesJson(text);
      const updated = new Map(savedSnaps);
      mixes.forEach(mix => {
        if (!mix.title || !mix.players?.length) return;
        updated.set(mix.title, mix);
      });
      await setSavedSnaps(updated);
      notify(`Imported ${mixes.length} mix${mixes.length === 1 ? '' : 'es'}`);
    } catch (err) {
      console.error(err);
      notify('Import failed — check the JSON file.');
    }
  };

  const sheet =
    mixesSheetOpen &&
    createPortal(
      <div
        className="mixes-overlay"
        onClick={() => setMixesSheetOpen(false)}
        role="presentation"
      >
        <div
          className="mixes-sheet"
          onClick={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mixes-sheet-title"
        >
          <div className="mixes-sheet__header">
            <div>
              <h2 id="mixes-sheet-title" className="mixes-sheet__title">
                Your mixes
              </h2>
              <p className="mixes-sheet__subtitle">
                Load, share, import or export soundscapes.
              </p>
            </div>
            <div className="mixes-sheet__header-actions">
              {snapCount > 0 && (
                <span className="mixes-sheet__count">{snapCount}</span>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                className="mixes-sheet__close"
                onClick={() => setMixesSheetOpen(false)}
                aria-label="Close mixes"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mixes-sheet__tools">
            <button
              type="button"
              className="mixes-sheet__tool"
              onClick={handleShareCurrent}
            >
              <i className="fa-solid fa-link" aria-hidden="true" />
              Share current
            </button>
            <button
              type="button"
              className="mixes-sheet__tool"
              onClick={handleExport}
            >
              <i className="fa-solid fa-file-export" aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              className="mixes-sheet__tool"
              onClick={() => importInputRef.current?.click()}
            >
              <i className="fa-solid fa-file-import" aria-hidden="true" />
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImportFile}
            />
          </div>

          <SavedSnapsList
            onLoad={() => setMixesSheetOpen(false)}
            onShare={async snap => {
              const url = buildShareUrl(snap);
              try {
                await navigator.clipboard.writeText(url);
                notify(`Link for "${snap.title}" copied`);
              } catch {
                notify('Could not copy link');
              }
            }}
          />
        </div>
      </div>,
      document.body
    );

  return sheet;
}

export function MixesSheetTrigger() {
  const { savedSnaps, setMixesSheetOpen } = useContext(Context);

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  return (
    <div className="bar-action-wrapper">
      <button
        type="button"
        className="bar-action"
        onClick={() => setMixesSheetOpen(true)}
        aria-label={`Mixes${snapCount > 0 ? `, ${snapCount} saved` : ''}`}
      >
        <i className="fa-solid fa-bookmark" aria-hidden="true" />
        <span className="bar-action__label">Mixes</span>
        {snapCount > 0 && (
          <span className="bar-action__badge" aria-hidden="true">
            {snapCount}
          </span>
        )}
      </button>
    </div>
  );
}
