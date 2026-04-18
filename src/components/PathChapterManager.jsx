import React, { useState } from 'react';
import { useNarrativeStore } from 'store';

// ADDED: PathChapterManager to provide CRUD UI for the new path and chapter collections
export default function PathChapterManager() {
  const pathDict = useNarrativeStore(state => state.path);
  const paths = Object.values(pathDict);
  const addPath = useNarrativeStore(state => state.addPath);
  const updatePath = useNarrativeStore(state => state.updatePath);
  const deletePath = useNarrativeStore(state => state.deletePath);

  const chapterDict = useNarrativeStore(state => state.chapter);
  const chapters = Object.values(chapterDict);
  const addChapter = useNarrativeStore(state => state.addChapter);
  const updateChapter = useNarrativeStore(state => state.updateChapter);
  const deleteChapter = useNarrativeStore(state => state.deleteChapter);

  // ADDED: Local state specifically for the add-form text inputs (AR-03 compliant)
  const [newPathName, setNewPathName] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const handleAddPath = (e) => {
    e.preventDefault();
    if (newPathName.trim().length > 0) {
      addPath(newPathName);
      setNewPathName('');
    }
  };

  const handleAddChapter = (e) => {
    e.preventDefault();
    if (newChapterName.trim().length > 0) {
      addChapter(newChapterName);
      setNewChapterName('');
    }
  };

  const handleRenamePath = (id, currentName) => {
    const newName = window.prompt('Rename path:', currentName);
    if (newName !== null && newName.trim().length > 0) {
      updatePath(id, { name: newName.trim() });
    }
  };

  const handleRenameChapter = (id, currentName) => {
    const newName = window.prompt('Rename chapter:', currentName);
    if (newName !== null && newName.trim().length > 0) {
      updateChapter(id, { name: newName.trim() });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Paths Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Paths</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paths.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              No paths defined. Add one below.
            </div>
          ) : (
            paths.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleRenamePath(p.id, p.name)}
                    style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Rename
                  </button>
                  <button 
                    onClick={() => deletePath(p.id)}
                    style={{ padding: '4px 8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Add New Path</h4>
          <form onSubmit={handleAddPath} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" 
              value={newPathName} 
              onChange={(e) => setNewPathName(e.target.value)}
              placeholder="e.g. Act 1"
              style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button 
              type="submit" 
              disabled={newPathName.trim().length === 0}
              style={{ padding: '8px 16px', background: newPathName.trim().length === 0 ? 'var(--color-bg-hover)' : 'var(--color-accent)', color: newPathName.trim().length === 0 ? 'var(--color-text-secondary)' : 'white', border: newPathName.trim().length === 0 ? '1px solid var(--color-border)' : '1px solid var(--color-accent)', cursor: newPathName.trim().length === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
            >
              Confirm
            </button>
          </form>
        </div>
      </div>

      {/* Chapters Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Chapters</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chapters.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              No chapters defined. Add one below.
            </div>
          ) : (
            chapters.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <span style={{ color: 'var(--color-text-primary)' }}>{c.name}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleRenameChapter(c.id, c.name)}
                    style={{ padding: '4px 8px', background: 'var(--color-bg-hover)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Rename
                  </button>
                  <button 
                    onClick={() => deleteChapter(c.id)}
                    style={{ padding: '4px 8px', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-text-primary)' }}>Add New Chapter</h4>
          <form onSubmit={handleAddChapter} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
              type="text" 
              value={newChapterName} 
              onChange={(e) => setNewChapterName(e.target.value)}
              placeholder="e.g. Chapter 1"
              style={{ width: '100%', padding: '8px', backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button 
              type="submit" 
              disabled={newChapterName.trim().length === 0}
              style={{ padding: '8px 16px', background: newChapterName.trim().length === 0 ? 'var(--color-bg-hover)' : 'var(--color-accent)', color: newChapterName.trim().length === 0 ? 'var(--color-text-secondary)' : 'white', border: newChapterName.trim().length === 0 ? '1px solid var(--color-border)' : '1px solid var(--color-accent)', cursor: newChapterName.trim().length === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
