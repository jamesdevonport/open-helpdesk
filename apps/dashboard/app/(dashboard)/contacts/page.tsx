"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, Search } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default function ContactsPage() {
  const [search, setSearch] = useState("");

  const me = useQuery(api.agents.me);
  const orgId = me?.organizationId;

  const contacts = useQuery(
    api.contacts.list,
    orgId ? { organizationId: orgId } : "skip"
  );

  const filtered = contacts?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.externalId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="text-[15px] font-semibold text-text-primary">
          Contacts
        </h1>
      </div>

      {/* Search */}
      <div className="border-b border-border px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full rounded-lg border border-border bg-surface-secondary py-2 pl-9 pr-4 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered && filtered.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left">
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Contact
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Email
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  External ID
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Tags
                </th>
                <th className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr
                  key={contact._id}
                  className="border-b border-border-light transition-colors hover:bg-surface-secondary"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/contacts/${contact._id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar
                        name={contact.name || contact.email}
                        avatarUrl={contact.avatarUrl}
                        size="sm"
                      />
                      <span className="text-[13px] font-medium text-text-primary">
                        {contact.name || "Anonymous"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-[13px] text-text-secondary">
                    {contact.email || "-"}
                  </td>
                  <td className="px-6 py-3 text-[12px] font-mono text-text-tertiary">
                    {contact.externalId || "-"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(contact.tags || []).map((tag) => (
                        <Badge key={tag} variant="primary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[12px] text-text-tertiary">
                    {formatRelativeTime(contact.lastSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={Users}
            title="No contacts"
            description="Contacts will appear here when customers interact with the widget."
          />
        )}
      </div>
    </div>
  );
}
