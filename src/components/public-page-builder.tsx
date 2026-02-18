"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2, GripVertical, Pencil, Image as ImageIcon, Video } from "lucide-react";
import { PexelsMediaPicker } from "./pexels-media-picker";
import type { BlockConfig } from "@/app/api/public-page-blocks/route";
import { DEFAULT_HEADER_IMAGE_URL } from "@/lib/form-defaults";

type PublicPageBlock = {
  id: string;
  organization_id: string;
  block_type: "video" | "image" | "donation_form";
  sort_order: number;
  config: BlockConfig;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  organizationId: string;
  organizationName: string;
  slug: string;
  baseUrl: string;
};

function SortableBlockRow({
  block,
  onEdit,
  onDelete,
  baseUrl,
}: {
  block: PublicPageBlock;
  onEdit: () => void;
  onDelete: () => void;
  baseUrl: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = block.config ?? {};
  const mediaUrl = config.media_url?.trim() || null;
  const title = config.title?.trim() || null;
  const subtitle = config.subtitle?.trim() || null;
  const isVideo = block.block_type === "video" && mediaUrl;
  const thumbUrl = !isVideo
    ? (mediaUrl || DEFAULT_HEADER_IMAGE_URL)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-shadow ${
        isDragging ? "border-emerald-400 shadow-lg z-10" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {isVideo ? (
          <video
            src={mediaUrl!}
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={thumbUrl!}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {block.block_type === "video" ? (
            <Video className="h-4 w-4 text-slate-500" />
          ) : (
            <ImageIcon className="h-4 w-4 text-slate-500" />
          )}
          <span className="font-medium text-slate-900">
            {title || "Untitled block"}
          </span>
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-sm text-slate-600">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PublicPageBuilder({
  organizationId,
  organizationName,
  slug,
  baseUrl,
}: Props) {
  const [blocks, setBlocks] = useState<PublicPageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PublicPageBlock | null>(null);
  const [addingBlock, setAddingBlock] = useState(false);
  const [addingBlockConfig, setAddingBlockConfig] = useState<{ type: "video" | "image"; title: string; subtitle: string } | null>(null);
  const [pexelsPicker, setPexelsPicker] = useState<{ field: "image" | "video" } | null>(null);
  const hasAttemptedSeed = useRef(false);

  const fetchBlocks = useCallback(async (): Promise<PublicPageBlock[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public-page-blocks?organizationId=${organizationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch");
      const list = (Array.isArray(data) ? data : []).filter(
        (b: PublicPageBlock) => b.block_type !== "donation_form"
      );
      setBlocks(list);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch blocks");
      setBlocks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  useEffect(() => {
    if (!loading && blocks.length === 0 && !error && !hasAttemptedSeed.current) {
      hasAttemptedSeed.current = true;
      const seed = async () => {
        setSeeding(true);
        try {
          const res = await fetch("/api/public-page-blocks/seed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId }),
          });
          if (res.ok) await fetchBlocks();
        } catch {
          // ignore
        } finally {
          setSeeding(false);
        }
      };
      seed();
    }
  }, [loading, blocks.length, error, organizationId, fetchBlocks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);
    const order = reordered.map((b) => b.id);
    try {
      const res = await fetch("/api/public-page-blocks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, order }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
    } catch {
      setBlocks(blocks);
    }
  };

  const handleUpdateBlock = async (id: string, config: BlockConfig) => {
    try {
      const res = await fetch(`/api/public-page-blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchBlocks();
      setEditingBlock(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("Delete this block?")) return;
    try {
      const res = await fetch(`/api/public-page-blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchBlocks();
      setEditingBlock(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleAddBlock = async (blockType: "video" | "image", config: BlockConfig) => {
    try {
      const res = await fetch("/api/public-page-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, block_type: blockType, config }),
      });
      if (!res.ok) throw new Error("Failed to add");
      await fetchBlocks();
      setAddingBlock(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const previewUrl = `${baseUrl.replace(/\/$/, "")}/org/${slug}`;

  return (
    <div className="space-y-8">
      {pexelsPicker && (
        <PexelsMediaPicker
          mode={pexelsPicker.field === "video" ? "videos" : "photos"}
          onSelect={(url, type) => {
            if (editingBlock) {
              handleUpdateBlock(editingBlock.id, {
                ...editingBlock.config,
                media_url: url,
              });
            } else if (addingBlockConfig) {
              const newConfig = {
                media_url: url,
                title: addingBlockConfig.title || organizationName,
                subtitle: addingBlockConfig.subtitle || null,
              };
              handleAddBlock(addingBlockConfig.type, newConfig);
              setAddingBlockConfig(null);
            }
            setPexelsPicker(null);
            setEditingBlock(null);
            setAddingBlock(false);
            setAddingBlockConfig(null);
          }}
          onClose={() => {
            setPexelsPicker(null);
            setAddingBlockConfig(null);
          }}
        />
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Public page
        </h1>
        <p className="mt-2 text-slate-600">
          Build your page visually. Drag blocks to reorder, click to edit.
        </p>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:underline font-medium"
        >
          View your page
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Page blocks</h2>
          <button
            type="button"
            onClick={() => setAddingBlock(true)}
            disabled={loading || seeding}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add block
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>
        )}

        {loading || seeding ? (
          <div className="py-12 text-center text-slate-500">
            {seeding ? "Setting up your page…" : "Loading…"}
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No blocks yet. Click &quot;Add block&quot; to get started.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {blocks.map((block) => (
                  <li key={block.id}>
                    <SortableBlockRow
                      block={block}
                      baseUrl={baseUrl}
                      onEdit={() => setEditingBlock(block)}
                      onDelete={() => handleDeleteBlock(block.id)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {editingBlock && (
        <BlockEditorModal
          block={editingBlock}
          organizationName={organizationName}
          onSave={(config) => handleUpdateBlock(editingBlock.id, config)}
          onClose={() => setEditingBlock(null)}
          onPickMedia={(field) => setPexelsPicker({ field })}
        />
      )}

      {addingBlock && (
        <AddBlockModal
          organizationName={organizationName}
          onConfirm={(type, title, subtitle) => {
            setAddingBlock(false);
            setAddingBlockConfig({ type, title, subtitle });
            setPexelsPicker({ field: type });
          }}
          onClose={() => setAddingBlock(false)}
        />
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Live preview</h2>
        <p className="text-sm text-slate-600 mb-4">
          How your public page looks to visitors.
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
          <iframe
            src={previewUrl}
            title={`Preview: ${organizationName}`}
            className="w-full"
            style={{ height: "min(500px, 60vh)" }}
          />
        </div>
      </div>
    </div>
  );
}

function BlockEditorModal({
  block,
  organizationName,
  onSave,
  onClose,
  onPickMedia,
}: {
  block: PublicPageBlock;
  organizationName: string;
  onSave: (config: BlockConfig) => void;
  onClose: () => void;
  onPickMedia: (field: "image" | "video") => void;
}) {
  const [title, setTitle] = useState(block.config?.title ?? organizationName);
  const [subtitle, setSubtitle] = useState(block.config?.subtitle ?? "");
  const [mediaUrl, setMediaUrl] = useState(block.config?.media_url ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Edit block</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={organizationName}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Support our mission"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Media</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => onPickMedia(block.block_type === "video" ? "video" : "image")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Browse
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave({ media_url: mediaUrl || null, title: title || null, subtitle: subtitle || null })}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBlockModal({
  organizationName,
  onConfirm,
  onClose,
}: {
  organizationName: string;
  onConfirm: (type: "video" | "image", title: string, subtitle: string) => void;
  onClose: () => void;
}) {
  const [blockType, setBlockType] = useState<"video" | "image">("image");
  const [title, setTitle] = useState(organizationName);
  const [subtitle, setSubtitle] = useState("");

  const handleAddWithMedia = () => {
    onConfirm(blockType, title || organizationName, subtitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Add block</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Block type</label>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as "video" | "image")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={organizationName}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Support our mission"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddWithMedia}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add & pick media
          </button>
        </div>
      </div>
    </div>
  );
}
