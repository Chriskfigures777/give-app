"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { PexelsMediaPicker } from "@/components/pexels-media-picker";

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  image_url: string | null;
};

type Props = {
  organizationId: string;
};

export function TeamEditorClient({ organizationId }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", image_url: "" });
  const membersRef = useRef<TeamMember[]>([]);
  membersRef.current = members;
  const [pexelsPickerFor, setPexelsPickerFor] = useState<string | "new" | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | "new" | null>(null);

  async function handleFileUpload(file: File, target: "new" | string) {
    setUploadingFor(target);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organizationId", organizationId);
      const res = await fetch("/api/upload/team-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      const url = data.url as string;
      if (target === "new") {
        setNewMember((m) => ({ ...m, image_url: url }));
      } else {
        const member = membersRef.current.find((m) => m.id === target);
        if (member) {
          setMembers((prev) =>
            prev.map((m) => (m.id === target ? { ...m, image_url: url } : m))
          );
          handleSave(member, "image_url", url);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFor(null);
    }
  }

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`/api/organization-team-members?organizationId=${organizationId}`);
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [organizationId]);

  async function handleAdd() {
    if (!newMember.name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/organization-team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name: newMember.name.trim(),
          role: newMember.role.trim() || null,
          bio: newMember.bio.trim() || null,
          image_url: newMember.image_url.trim() || null,
          sort_order: members.length,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add");
      }
      const created = await res.json();
      setMembers((prev) => [...prev, created]);
      setNewMember({ name: "", role: "", bio: "", image_url: "" });
      setAdding(false);
      router.refresh();
    } catch (err) {
      setAdding(false);
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  }

  async function handleSave(member: TeamMember, field: string, value: string) {
    const current = membersRef.current.find((m) => m.id === member.id);
    const updated = { ...(current ?? member), [field]: value || null };
    try {
      const res = await fetch(`/api/organization-team-members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          role: updated.role || null,
          bio: updated.bio || null,
          image_url: updated.image_url || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? updated : m))
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this team member?")) return;
    try {
      const res = await fetch(`/api/organization-team-members/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setMembers((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-slate-500">Loading team members…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
      {pexelsPickerFor && (
        <PexelsMediaPicker
          mode="photos"
          onSelect={(url) => {
            if (pexelsPickerFor === "new") {
              setNewMember((m) => ({ ...m, image_url: url }));
            } else {
              const member = membersRef.current.find((m) => m.id === pexelsPickerFor);
              if (member) {
                setMembers((prev) =>
                  prev.map((m) =>
                    m.id === pexelsPickerFor ? { ...m, image_url: url } : m
                  )
                );
                handleSave(member, "image_url", url);
              }
            }
            setPexelsPickerFor(null);
          }}
          onClose={() => setPexelsPickerFor(null)}
        />
      )}
      <h2 className="text-lg font-semibold text-slate-900">Team members</h2>
      <p className="text-sm text-slate-600">
        Add team members with a photo, name, role, and description. They appear in the Team section on your page.
      </p>

      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-xl border border-slate-200 p-4 space-y-4 bg-slate-50/40"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDelete(member.id)}
                className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 rounded"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-32 shrink-0">
                <label className="block text-xs font-medium text-slate-600 mb-1">Photo</label>
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPexelsPickerFor(member.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-medium"
                  >
                    Change photo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    id={`upload-${member.id}`}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, member.id);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor={`upload-${member.id}`}
                    className={`shrink-0 inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${uploadingFor === member.id ? "opacity-70" : ""}`}
                  >
                    <Upload className="h-3 w-3" />
                    {uploadingFor === member.id ? "Uploading…" : "Upload"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPexelsPickerFor(member.id)}
                    className="shrink-0 rounded border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Pexels
                  </button>
                  <input
                    type="url"
                    value={member.image_url ?? ""}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((m) =>
                          m.id === member.id ? { ...m, image_url: e.target.value } : m
                        )
                      )
                    }
                    onBlur={(e) => handleSave(member, "image_url", (e.target as HTMLInputElement).value)}
                    placeholder="Or paste URL"
                    className="flex-1 min-w-[120px] rounded border border-slate-200 px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={member.name}
                      onChange={(e) =>
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === member.id ? { ...m, name: e.target.value } : m
                          )
                        )
                      }
                      onBlur={(e) => handleSave(member, "name", (e.target as HTMLInputElement).value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                    <input
                      type="text"
                      name="role"
                      value={member.role ?? ""}
                      onChange={(e) =>
                        setMembers((prev) =>
                          prev.map((m) =>
                            m.id === member.id ? { ...m, role: e.target.value } : m
                          )
                        )
                      }
                      onBlur={(e) => handleSave(member, "role", (e.target as HTMLInputElement).value)}
                      placeholder="e.g. Pastor, Director"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <textarea
                    name="bio"
                    value={member.bio ?? ""}
                    onChange={(e) =>
                      setMembers((prev) =>
                        prev.map((m) =>
                          m.id === member.id ? { ...m, bio: e.target.value } : m
                        )
                      )
                    }
                    onBlur={(e) => handleSave(member, "bio", (e.target as HTMLTextAreaElement).value)}
                    rows={3}
                    placeholder="Add a short description or bio for this team member..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-4 bg-slate-50/30">
        <h3 className="text-sm font-medium text-slate-700">Add team member</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-32 shrink-0">
            <label className="block text-xs font-medium text-slate-600 mb-1">Photo</label>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              {newMember.image_url ? (
                <img
                  src={newMember.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setPexelsPickerFor("new")}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-medium"
              >
                Add photo
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                id="upload-new"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, "new");
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="upload-new"
                className={`shrink-0 inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer disabled:opacity-50 ${uploadingFor === "new" ? "opacity-70" : ""}`}
              >
                <Upload className="h-3 w-3" />
                {uploadingFor === "new" ? "Uploading…" : "Upload"}
              </label>
              <button
                type="button"
                onClick={() => setPexelsPickerFor("new")}
                className="shrink-0 rounded border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Pexels
              </button>
              <input
                type="url"
                value={newMember.image_url}
                onChange={(e) => setNewMember((m) => ({ ...m, image_url: e.target.value }))}
                placeholder="Or paste URL"
                className="flex-1 min-w-[120px] rounded border border-slate-200 px-2 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <input
                  type="text"
                  value={newMember.role}
                  onChange={(e) => setNewMember((m) => ({ ...m, role: e.target.value }))}
                  placeholder="e.g. Pastor, Director"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={newMember.bio}
                onChange={(e) => setNewMember((m) => ({ ...m, bio: e.target.value }))}
                rows={3}
                placeholder="Add a short description or bio for this team member..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAdd()}
              disabled={adding || !newMember.name.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {adding ? "Adding…" : "Add member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
