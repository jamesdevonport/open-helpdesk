"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Users,
  Plus,
  Camera,
  Check,
  Loader2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeamSettingsPage() {
  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;
  const agents = useQuery(
    api.agents.list,
    orgId ? { organizationId: orgId } : "skip"
  );
  const updateStatus = useMutation(api.agents.updateStatus);
  const updateProfile = useMutation(api.agents.updateProfile);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = (agent: any) => {
    setEditingId(agent._id);
    setEditName(agent.name);
    setEditAvatarUrl(agent.avatarUrl || "");
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateProfile({
        agentId: editingId as Id<"agents">,
        name: editName || undefined,
        avatarUrl: editAvatarUrl || undefined,
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (agentId: string, status: string) => {
    await updateStatus({ agentId: agentId as Id<"agents">, status });
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">Team</h1>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-6 py-8">
          {agents && agents.length > 0 ? (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent._id}
                  className="rounded-xl border border-border bg-surface overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar
                          name={agent.name}
                          avatarUrl={agent.avatarUrl}
                          size="md"
                        />
                        <div
                          className={cn(
                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                            agent.status === "online"
                              ? "bg-emerald-500"
                              : agent.status === "away"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">
                          {agent.name}
                        </p>
                        <p className="text-[12px] text-text-secondary">
                          {agent.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status toggle */}
                      <div className="flex gap-1">
                        {(["online", "away", "offline"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(agent._id, s)}
                            className={cn(
                              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                              agent.status === s
                                ? s === "online"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : s === "away"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                : "text-text-tertiary hover:bg-surface-tertiary"
                            )}
                          >
                            <Circle
                              className={cn(
                                "h-2 w-2",
                                s === "online"
                                  ? "fill-emerald-500 text-emerald-500"
                                  : s === "away"
                                    ? "fill-amber-500 text-amber-500"
                                    : "fill-gray-400 text-gray-400"
                              )}
                            />
                            {s}
                          </button>
                        ))}
                      </div>
                      <Badge
                        variant={
                          agent.role === "admin" ? "primary" : "default"
                        }
                      >
                        {agent.role}
                      </Badge>
                      <button
                        onClick={() =>
                          editingId === agent._id
                            ? setEditingId(null)
                            : startEditing(agent)
                        }
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary transition-colors"
                      >
                        {editingId === agent._id ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Edit panel */}
                  {editingId === agent._id && (
                    <div className="border-t border-border-light bg-surface-secondary px-4 py-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[12px] font-medium text-text-secondary">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text-primary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-text-secondary">
                            Avatar URL
                          </label>
                          <div className="mt-1 flex items-center gap-3">
                            <input
                              type="url"
                              value={editAvatarUrl}
                              onChange={(e) => setEditAvatarUrl(e.target.value)}
                              placeholder="https://example.com/photo.jpg"
                              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
                            />
                            {editAvatarUrl && (
                              <img
                                src={editAvatarUrl}
                                alt="Preview"
                                className="h-8 w-8 rounded-full object-cover border border-border"
                                onError={(e) =>
                                  ((e.target as HTMLImageElement).style.display =
                                    "none")
                                }
                              />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-text-tertiary">
                            Paste a URL to your profile photo. This will appear next to your messages in the widget.
                          </p>
                        </div>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Save Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : agents === undefined ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Complete the setup to add your agent profile."
            />
          )}
        </div>
      </div>
    </div>
  );
}
