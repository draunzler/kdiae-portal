"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder, faFolderOpen, faFolderPlus, faCloudArrowUp,
  faVideo, faEllipsisVertical, faChevronRight, faChevronDown,
  faTrash, faPencil, faDownload, faXmark,
  faMagnifyingGlass, faTableCells, faTableList,
  faChevronLeft, faImages,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { galleryApi } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type MediaType = "image" | "video";

interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  size: number; // bytes
  uploadedAt: string;
  folderId: string;
  mimeType: string;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  color: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FOLDER_COLORS = [
  "#FFCA2B", "#3B82F6", "#10B981", "#F43F5E", "#8B5CF6",
  "#F97316", "#06B6D4", "#84CC16",
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function hashColor(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return FOLDER_COLORS[Math.abs(hash) % FOLDER_COLORS.length];
}

function getParentPrefix(prefix: string): string {
  const p = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? `${p.slice(0, idx + 1)}` : "";
}

function baseName(path: string): string {
  const p = path.endsWith("/") ? path.slice(0, -1) : path;
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? p.slice(idx + 1) : p;
}

function getFileType(name: string): MediaType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".webm") || lower.endsWith(".avi")) {
    return "video";
  }
  return "image";
}

function parseGallery(objects: Array<{ key: string; size: number; last_modified: string | null; url: string }>) {
  const foldersMap = new Map<string, Folder>();
  foldersMap.set("root", {
    id: "root",
    name: "Gallery",
    parentId: null,
    createdAt: new Date().toISOString().slice(0, 10),
    color: "#3B82F6",
  });

  const mediaFiles: MediaFile[] = [];

  for (const obj of objects) {
    const key = obj.key;
    if (!key) continue;

    const parts = key.split("/").filter(Boolean);
    let prefix = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      prefix += `${parts[i]}/`;
      if (!foldersMap.has(prefix)) {
        const parentPrefix = getParentPrefix(prefix);
        foldersMap.set(prefix, {
          id: prefix,
          name: baseName(prefix),
          parentId: parentPrefix || "root",
          createdAt: new Date().toISOString().slice(0, 10),
          color: hashColor(prefix),
        });
      }
    }

    if (key.endsWith(".keep")) continue;

    const parentPrefix = getParentPrefix(key);
    const folderId = parentPrefix || "root";
    mediaFiles.push({
      id: key,
      name: baseName(key),
      type: getFileType(key),
      url: obj.url || "",
      size: obj.size,
      uploadedAt: obj.last_modified ? new Date(obj.last_modified).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      folderId,
      mimeType: getFileType(key) === "video" ? "video/*" : "image/*",
    });
  }

  return { folders: Array.from(foldersMap.values()), mediaFiles };
}

// ── FolderTree Component ──────────────────────────────────────────────────────

function FolderTree({
  folders,
  mediaFiles,
  currentFolderId,
  onSelect,
  mobile = false,
}: {
  folders: Folder[];
  mediaFiles: MediaFile[];
  currentFolderId: string;
  onSelect: (id: string) => void;
  mobile?: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root"]));

  const activePath = useMemo(() => {
    const path = new Set<string>(["root"]);
    if (!currentFolderId || currentFolderId === "root") return path;

    let cursor = folders.find((f) => f.id === currentFolderId);
    while (cursor?.parentId) {
      path.add(cursor.id);
      const parentId = cursor.parentId;
      if (parentId === "root") {
        path.add("root");
        break;
      }
      cursor = folders.find((f) => f.id === parentId);
    }

    return path;
  }, [currentFolderId, folders]);

  function countItems(folderId: string): number {
    const direct = mediaFiles.filter(m => m.folderId === folderId).length;
    const sub = folders.filter(f => f.parentId === folderId);
    return direct + sub.reduce((a, f) => a + countItems(f.id), 0);
  }

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function renderNode(folder: Folder, depth = 0): React.ReactNode {
    const children = folders.filter(f => f.parentId === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(folder.id) || activePath.has(folder.id);
    const isActive = currentFolderId === folder.id;
    const count = countItems(folder.id);

    return (
      <div key={folder.id}>
        <div
          style={{ paddingLeft: depth * 16 + 8 }}
          className={`w-full flex items-center gap-1.5 pr-2 rounded-md transition-colors ${
            isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(folder.id);
              }}
              className="w-6 h-8 flex items-center justify-center text-slate-400"
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} className="w-2.5 shrink-0" />
            </button>
          ) : (
            <span className="w-6 h-8 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => {
              onSelect(folder.id);
              if (!mobile && hasChildren) toggle(folder.id);
            }}
            className="flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-left"
          >
            <FontAwesomeIcon
              icon={isExpanded && hasChildren ? faFolderOpen : faFolder}
              className="w-3.5 shrink-0"
              style={{ color: folder.color }}
            />
            <span className="flex-1 text-left truncate text-[12.5px]">{folder.name}</span>
            {count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
              }`}>{count}</span>
            )}
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const roots = folders.filter(f => f.parentId === null);
  return (
    <div className="flex flex-col gap-0.5 select-none">
      {roots.map(r => renderNode(r))}
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function getBreadcrumb(folders: Folder[], folderId: string): Folder[] {
  const crumbs: Folder[] = [];
  let current: Folder | undefined = folders.find(f => f.id === folderId);
  while (current) {
    crumbs.unshift(current);
    current = current.parentId ? folders.find(f => f.id === current!.parentId) : undefined;
  }
  return crumbs;
}

// ── Context Menu ──────────────────────────────────────────────────────────────

interface CtxMenu {
  x: number; y: number;
  type: "folder" | "file";
  id: string;
}

function ContextMenu({
  menu, onClose, onRename, onDelete, onDownload,
}: {
  menu: CtxMenu;
  onClose: () => void;
  onRename: (id: string, type: "folder" | "file") => void;
  onDelete: (id: string, type: "folder" | "file") => void;
  onDownload?: (id: string) => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[160px] text-[13px]"
      style={{ top: menu.y, left: menu.x }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => { onRename(menu.id, menu.type); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700"
      >
        <FontAwesomeIcon icon={faPencil} className="w-3.5 text-slate-400" />
        Rename
      </button>
      {menu.type === "file" && onDownload && (
        <button
          onClick={() => { onDownload(menu.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700"
        >
          <FontAwesomeIcon icon={faDownload} className="w-3.5 text-slate-400" />
          Download
        </button>
      )}
      <div className="my-1 border-t border-slate-100" />
      <button
        onClick={() => { onDelete(menu.id, menu.type); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-500"
      >
        <FontAwesomeIcon icon={faTrash} className="w-3.5" />
        Delete
      </button>
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  files, index, onClose, onNav,
}: {
  files: MediaFile[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  const file = files[index];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNav(index - 1);
      if (e.key === "ArrowRight" && index < files.length - 1) onNav(index + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, files.length, onClose, onNav]);

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}
      {index < files.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      )}

      <div onClick={e => e.stopPropagation()} className="flex flex-col items-center max-w-5xl w-full px-16">
        {file.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="w-full max-w-3xl h-[320px] rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-white/70 text-sm">
            Preview unavailable (set R2_PUBLIC_BASE_URL or use download)
          </div>
        )}
        <div className="mt-4 text-white/80 text-sm text-center">
          <p className="font-medium text-white">{file.name}</p>
          <p className="text-xs mt-0.5 text-white/50">
            {formatBytes(file.size)} · {formatDate(file.uploadedAt)} · {index + 1} / {files.length}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [folders, setFolders] = useState<Folder[]>([{ id: "root", name: "Gallery", parentId: null, createdAt: new Date().toISOString().slice(0, 10), color: "#3B82F6" }]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [lightbox, setLightbox] = useState<{ files: MediaFile[]; index: number } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ id: string; type: "folder" | "file"; name: string } | null>(null);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFoldersMobile, setShowFoldersMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawerTouchStartX = useRef<number | null>(null);
  const drawerTouchStartY = useRef<number | null>(null);

  const currentPrefix = currentFolderId === "root" ? "" : currentFolderId;
  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const parentFolderId = currentFolder?.parentId;

  const refreshGallery = useCallback(async () => {
    setLoading(true);
    try {
      const objects = await galleryApi.listObjects("");
      const parsed = parseGallery(objects);
      setFolders(parsed.folders);
      setMediaFiles(parsed.mediaFiles);
    } catch {
      setFolders([{ id: "root", name: "Gallery", parentId: null, createdAt: new Date().toISOString().slice(0, 10), color: "#3B82F6" }]);
      setMediaFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      refreshGallery();
    }, 0);
    return () => clearTimeout(handle);
  }, [refreshGallery]);

  const breadcrumb = getBreadcrumb(folders, currentFolderId);
  const subFolders = folders.filter(f => f.parentId === currentFolderId);
  const filesInFolder = mediaFiles.filter(f =>
    f.folderId === currentFolderId &&
    (search === "" || f.name.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredFolders = subFolders.filter(f =>
    search === "" || f.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openCtxMenu(e: React.MouseEvent, type: "folder" | "file", id: string) {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, type, id });
  }

  async function handleDelete(id: string, type: "folder" | "file") {
    if (type === "folder") {
      if (id === "root") return;
      await galleryApi.deleteFolder(id);
      if (currentFolderId === id || currentFolderId.startsWith(id)) {
        setCurrentFolderId(folders.find(f => f.id === id)?.parentId ?? "root");
      }
      await refreshGallery();
    } else {
      await galleryApi.deleteFile(id);
      await refreshGallery();
    }
  }

  function handleRenameOpen(id: string, type: "folder" | "file") {
    const name = type === "folder"
      ? folders.find(f => f.id === id)?.name ?? ""
      : mediaFiles.find(m => m.id === id)?.name ?? "";
    setRenameDialog({ id, type, name });
    setRenameName(name);
  }

  async function handleRenameSubmit() {
    if (!renameDialog || !renameName.trim()) return;
    if (renameDialog.type === "folder") {
      if (renameDialog.id === "root") return;
      const folder = folders.find(f => f.id === renameDialog.id);
      const parentPrefix = folder?.parentId && folder.parentId !== "root" ? folder.parentId : "";
      const newPrefix = `${parentPrefix}${renameName.trim()}/`;
      await galleryApi.renameFolder(renameDialog.id, newPrefix);
      if (currentFolderId === renameDialog.id) setCurrentFolderId(newPrefix);
    } else {
      const file = mediaFiles.find(m => m.id === renameDialog.id);
      if (!file) return;
      const parentPrefix = getParentPrefix(file.id);
      const newKey = `${parentPrefix}${renameName.trim()}`;
      await galleryApi.renameFile(file.id, newKey);
    }
    await refreshGallery();
    setRenameDialog(null);
  }

  async function handleNewFolder() {
    if (!newFolderName.trim()) return;
    const prefix = `${currentPrefix}${newFolderName.trim()}/`;
    await galleryApi.createFolder(prefix);
    await refreshGallery();
    setNewFolderDialog(false);
    setNewFolderName("");
    setNewFolderColor(FOLDER_COLORS[0]);
  }

  async function uploadFiles(files: File[]) {
    const items = files.map(f => ({ name: f.name, progress: 0 }));
    setUploadProgress(prev => [...prev, ...items]);

    for (const file of files) {
      try {
        setUploadProgress(prev => prev.map(it => it.name === file.name ? { ...it, progress: 20 } : it));
        const key = `${currentPrefix}${file.name}`;
        const signed = await galleryApi.presignUpload(key, file.type || "application/octet-stream");
        await fetch(signed.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        // Register in MongoDB so the public website can display it
        try {
          await galleryApi.registerItem(key);
        } catch {
          // Non-fatal: item will still be in R2; can be resynced later
        }
        setUploadProgress(prev => prev.map(it => it.name === file.name ? { ...it, progress: 100 } : it));
      } catch {
        setUploadProgress(prev => prev.map(it => it.name === file.name ? { ...it, progress: 100 } : it));
      }
    }
    setUploadProgress([]);
    await refreshGallery();
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(Array.from(e.dataTransfer.files));
  }

  function openFileAt(files: MediaFile[], index: number) {
    setLightbox({ files, index });
  }

  // Total stats
  const totalFiles = mediaFiles.filter(m => m.folderId === currentFolderId).length;
  const totalSize = mediaFiles.filter(m => m.folderId === currentFolderId).reduce((a, m) => a + m.size, 0);

  return (
    <>
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden h-full">
          {/* ── Left Sidebar: Folder Tree ─────────────────────────────── */}
          <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-slate-200 flex-col overflow-hidden">
            <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Folders</span>
              <button
                onClick={() => setNewFolderDialog(true)}
                title="New folder"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <FontAwesomeIcon icon={faFolderPlus} className="w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <FolderTree
                folders={folders}
                mediaFiles={mediaFiles}
                currentFolderId={currentFolderId}
                onSelect={setCurrentFolderId}
              />
            </div>
          </aside>

          {showFoldersMobile && (
            <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setShowFoldersMobile(false)}>
              <aside
                className="absolute left-0 top-0 h-full w-[82%] max-w-[300px] bg-white border-r border-slate-200 flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  drawerTouchStartX.current = t.clientX;
                  drawerTouchStartY.current = t.clientY;
                }}
                onTouchEnd={(e) => {
                  if (drawerTouchStartX.current == null || drawerTouchStartY.current == null) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - drawerTouchStartX.current;
                  const dy = t.clientY - drawerTouchStartY.current;
                  drawerTouchStartX.current = null;
                  drawerTouchStartY.current = null;
                  if (dx < -60 && Math.abs(dy) < 60) {
                    setShowFoldersMobile(false);
                  }
                }}
              >
                <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Folders</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setNewFolderDialog(true)}
                      title="New folder"
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <FontAwesomeIcon icon={faFolderPlus} className="w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowFoldersMobile(false)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2">
                  <FolderTree
                    folders={folders}
                    mediaFiles={mediaFiles}
                    currentFolderId={currentFolderId}
                    mobile
                    onSelect={(id) => { setCurrentFolderId(id); }}
                  />
                </div>
              </aside>
            </div>
          )}

          {/* ── Main Area ────────────────────────────────────────────── */}
          <main
            className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors ${dragOver ? "bg-blue-50" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* Toolbar */}
            <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex flex-wrap md:flex-nowrap items-center gap-2.5 md:gap-3 shrink-0">
              {currentFolderId !== "root" && (
                <button
                  onClick={() => setCurrentFolderId(parentFolderId ?? "root")}
                  className="md:hidden w-8 h-8 border border-slate-200 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  title="Back"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="w-3.5" />
                </button>
              )}

              <button
                onClick={() => setShowFoldersMobile(true)}
                className="md:hidden w-8 h-8 border border-slate-200 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                title="Folders"
              >
                <FontAwesomeIcon icon={faFolderOpen} className="w-3.5" />
              </button>

              {/* Breadcrumb */}
              <nav className="order-1 md:order-none flex items-center gap-1 text-[12px] sm:text-[12.5px] flex-1 min-w-0 overflow-hidden">
                {breadcrumb.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <FontAwesomeIcon icon={faChevronRight} className="w-2 text-slate-300 shrink-0" />}
                    <button
                      onClick={() => setCurrentFolderId(crumb.id)}
                      className={`truncate transition-colors ${
                        i === breadcrumb.length - 1
                          ? "text-slate-800 font-semibold"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {i === 0 ? <FontAwesomeIcon icon={faImages} className="w-3.5" /> : crumb.name}
                    </button>
                  </span>
                ))}
              </nav>

              {/* Info */}
              <span className="hidden sm:inline text-[11px] text-slate-400 shrink-0">
                {totalFiles} file{totalFiles !== 1 ? "s" : ""} · {formatBytes(totalSize)}
              </span>

              {/* Search */}
              <div className="order-3 md:order-none relative shrink-0 w-full sm:w-auto sm:min-w-[176px]">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 text-slate-400" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-7 h-8 w-full sm:w-44 text-[12.5px]"
                />
              </div>

              {/* View toggle */}
              <div className="order-2 md:order-none flex items-center border border-slate-200 rounded-md overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`w-8 h-8 flex items-center justify-center text-[12px] transition-colors ${viewMode === "grid" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FontAwesomeIcon icon={faTableCells} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`w-8 h-8 flex items-center justify-center text-[12px] transition-colors ${viewMode === "list" ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <FontAwesomeIcon icon={faTableList} />
                </button>
              </div>

              {/* New folder */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewFolderDialog(true)}
                className="h-8 text-[12.5px] gap-1.5 shrink-0 hidden sm:inline-flex"
              >
                <FontAwesomeIcon icon={faFolderPlus} className="w-3" />
                New Folder
              </Button>

              {/* Upload */}
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-[12px] sm:text-[12.5px] gap-1.5 shrink-0 bg-[#007BFF] hover:bg-blue-600 ml-auto md:ml-0"
              >
                <FontAwesomeIcon icon={faCloudArrowUp} className="w-3.5" />
                Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Upload progress */}
            {uploadProgress.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-100 px-5 py-2 flex items-center gap-4 overflow-x-auto shrink-0">
                {uploadProgress.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 min-w-[160px]">
                    <FontAwesomeIcon icon={faCloudArrowUp} className="w-3 text-blue-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] text-blue-700 truncate max-w-[100px]">{item.name}</p>
                      <div className="h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-500 shrink-0">{Math.round(item.progress)}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Drag-over overlay */}
            {dragOver && (
              <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none rounded-lg m-4">
                <div className="flex flex-col items-center gap-2 text-blue-500">
                  <FontAwesomeIcon icon={faCloudArrowUp} className="w-10 h-10" />
                  <p className="text-lg font-semibold">Drop files here</p>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`sk-${i}`} className="h-28 rounded-xl border border-slate-100 bg-slate-50 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
              {/* Subfolders */}
              {filteredFolders.length > 0 && (
                <section className="mb-5">
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    Folders ({filteredFolders.length})
                  </h3>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {filteredFolders.map(folder => {
                        const count = mediaFiles.filter(m => m.folderId === folder.id).length;
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            onContextMenu={e => openCtxMenu(e, "folder", folder.id)}
                            className="group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all select-none"
                          >
                            <div
                              className="w-12 h-12 flex items-center justify-center rounded-xl"
                              style={{ background: folder.color + "22" }}
                            >
                              <FontAwesomeIcon
                                icon={faFolder}
                                className="w-7 h-7"
                                style={{ color: folder.color }}
                              />
                            </div>
                            <p className="text-[12px] font-medium text-slate-700 text-center leading-tight line-clamp-2">{folder.name}</p>
                            <p className="text-[10px] text-slate-400">{count} file{count !== 1 ? "s" : ""}</p>
                            <button
                              onContextMenu={e => e.stopPropagation()}
                              onClick={e => openCtxMenu(e, "folder", folder.id)}
                              className="absolute top-1.5 right-1.5 w-5 h-5 items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 hidden group-hover:flex"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} className="w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                      <div className="min-w-[620px]">
                      {filteredFolders.map((folder, i) => {
                        const count = mediaFiles.filter(m => m.folderId === folder.id).length;
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            onContextMenu={e => openCtxMenu(e, "folder", folder.id)}
                            className={`group flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors ${i > 0 ? "border-t border-slate-100" : ""}`}
                          >
                            <FontAwesomeIcon icon={faFolder} className="w-4 shrink-0" style={{ color: folder.color }} />
                            <span className="flex-1 text-[13px] text-slate-700 font-medium truncate">{folder.name}</span>
                            <span className="text-[11px] text-slate-400">{count} files</span>
                            <span className="text-[11px] text-slate-400">{formatDate(folder.createdAt)}</span>
                            <button
                              onClick={e => openCtxMenu(e, "folder", folder.id)}
                              className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} className="w-3" />
                            </button>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Files */}
              {filesInFolder.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    Files ({filesInFolder.length})
                  </h3>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {filesInFolder.map((file, idx) => (
                        <div
                          key={file.id}
                          onContextMenu={e => openCtxMenu(e, "file", file.id)}
                          className="group relative flex flex-col rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md cursor-pointer transition-all overflow-hidden"
                          onClick={() => openFileAt(filesInFolder, idx)}
                        >
                          <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                            {file.type === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <FontAwesomeIcon icon={faVideo} className="w-8 text-white/60" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                          <div className="px-2 py-1.5">
                            <p className="text-[11.5px] font-medium text-slate-700 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                          </div>
                          <button
                            onContextMenu={e => e.stopPropagation()}
                            onClick={e => { e.stopPropagation(); openCtxMenu(e, "file", file.id); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 items-center justify-center rounded-full bg-white/80 text-slate-600 hover:bg-white shadow-sm hidden group-hover:flex"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                      <div className="min-w-[700px]">
                      {filesInFolder.map((file, idx) => (
                        <div
                          key={file.id}
                          onContextMenu={e => openCtxMenu(e, "file", file.id)}
                          onClick={() => openFileAt(filesInFolder, idx)}
                          className={`group flex items-center gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors ${idx > 0 ? "border-t border-slate-100" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 shrink-0">
                            {file.type === "image" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                <FontAwesomeIcon icon={faVideo} className="w-3 text-white/60" />
                              </div>
                            )}
                          </div>
                          <span className="flex-1 text-[13px] text-slate-700 font-medium truncate">{file.name}</span>
                          <span className="text-[11px] text-slate-400 capitalize">{file.type}</span>
                          <span className="text-[11px] text-slate-400">{formatBytes(file.size)}</span>
                          <span className="text-[11px] text-slate-400">{formatDate(file.uploadedAt)}</span>
                          <button
                            onClick={e => { e.stopPropagation(); openCtxMenu(e, "file", file.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} className="w-3" />
                          </button>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Empty state */}
              {filteredFolders.length === 0 && filesInFolder.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  {search ? (
                    <>
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="w-10 h-10 mb-3 text-slate-200" />
                      <p className="text-[14px] font-medium">No results for &quot;{search}&quot;</p>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faImages} className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="text-[14px] font-medium">This folder is empty</p>
                      <p className="text-[12px] mt-1">Upload files or create a subfolder to get started</p>
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNewFolderDialog(true)}
                          className="text-[12.5px] gap-1.5"
                        >
                          <FontAwesomeIcon icon={faFolderPlus} className="w-3" />
                          New Folder
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[12.5px] gap-1.5 bg-[#007BFF] hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faCloudArrowUp} className="w-3.5" />
                          Upload Media
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </main>
        </div>

      {/* ── Context Menu ────────────────────────────────────────────────── */}
      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onRename={handleRenameOpen}
          onDelete={handleDelete}
          onDownload={async id => {
            const file = mediaFiles.find(m => m.id === id);
            if (!file) return;
            const signed = await galleryApi.presignDownload(file.id);
            const a = document.createElement("a");
            a.href = signed.url;
            a.download = file.name;
            a.click();
          }}
        />
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      {lightbox && (
        <Lightbox
          files={lightbox.files}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={i => setLightbox(prev => prev ? { ...prev, index: i } : null)}
        />
      )}

      {/* ── Rename Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!renameDialog} onOpenChange={open => !open && setRenameDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename {renameDialog?.type === "folder" ? "Folder" : "File"}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleRenameSubmit()}
            autoFocus
            className="mt-2"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setRenameDialog(null)}>Cancel</Button>
            <Button onClick={handleRenameSubmit} className="bg-[#007BFF] hover:bg-blue-600">Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Folder Dialog ────────────────────────────────────────────── */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNewFolder()}
              placeholder="Folder name"
              autoFocus
            />
            <div>
              <p className="text-[12px] text-slate-500 mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: color,
                      borderColor: newFolderColor === color ? "#334155" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setNewFolderDialog(false); setNewFolderName(""); }}>Cancel</Button>
            <Button
              onClick={handleNewFolder}
              disabled={!newFolderName.trim()}
              className="bg-[#007BFF] hover:bg-blue-600"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
