import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useParties, usePartyMutations, useSubParties, useSubPartyMutations } from "../../hooks";
import PageHeader from "../../components/shared/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../../components/ui/table";

// ─── Constants ────────────────────────────────────────────────────────────────

// All fields match Party_Master model: name, whatsapp_number, transport, marka, station
const EMPTY_PARTY_FORM = {
  name: "", whatsapp_number: "",
  transport: "", marka: "", station: "",
};

const EMPTY_SUB_FORM = {
  name: "", transport: "", marka: "", station: "", parent_party: "",
};

// ─── Shared field config ──────────────────────────────────────────────────────

/**
 * Fields shared between Party and Sub-Party forms.
 * Defined once here so both forms stay in sync if fields change.
 */
const SHARED_LOCATION_FIELDS = [
  { key: "transport", label: "Transport", placeholder: "e.g. DTDC"    },
  { key: "marka",     label: "Marka",     placeholder: "e.g. RF-001"  },
  { key: "station",   label: "Station",   placeholder: "e.g. Delhi"   },
];

// ─── Sub-Party Rows ───────────────────────────────────────────────────────────

function SubPartyRows({ partyId }) {
  const { data: subs = [] }        = useSubParties(partyId);
  const { create, update, remove } = useSubPartyMutations();
  const [open, setOpen]            = useState(false);
  const [editing, setEditing]      = useState(null);
  const [form, setForm]            = useState(EMPTY_SUB_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_SUB_FORM, parent_party: partyId });
    setOpen(true);
  };

  const openEdit = (sub) => {
    setEditing(sub);
    setForm({
      name:         sub.name,
      transport:    sub.transport,
      marka:        sub.marka,
      station:      sub.station,
      parent_party: partyId,
    });
    setOpen(true);
  };

  const handleSave = () => {
    if (editing) update.mutate({ id: editing.id, data: form });
    else         create.mutate(form);
    setOpen(false);
  };

  return (
    <>
      {subs.map(sub => (
        <TableRow key={sub.id} className="bg-zinc-50/50">
          <TableCell className="pl-10 text-zinc-600 text-sm">↳ {sub.name}</TableCell>
          <TableCell className="text-zinc-500 text-sm">{sub.transport}</TableCell>
          <TableCell className="text-zinc-500 text-sm">{sub.marka}</TableCell>
          <TableCell className="text-zinc-500 text-sm">{sub.station}</TableCell>
          <TableCell className="text-right">
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => openEdit(sub)}>
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="icon"
                className="text-red-500"
                onClick={() => remove.mutate(sub.id)}>
                <Trash2 size={13} />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}

      <TableRow className="bg-zinc-50/30">
        <TableCell colSpan={5} className="pl-10 py-1.5">
          <button onClick={openCreate}
            className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
            <Plus size={12} /> Add sub-party
          </button>
        </TableCell>
      </TableRow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sub-Party" : "Add Sub-Party"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Name</label>
              <Input className="mt-1" placeholder="Branch name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            {SHARED_LOCATION_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-zinc-700">{label}</label>
                <Input className="mt-1" placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Party Form Dialog ────────────────────────────────────────────────────────

/**
 * Used for both create and edit of a Party.
 * Now includes transport, marka, station — same fields as Sub-Party.
 */
function PartyFormDialog({ open, onOpenChange, editing, onSave }) {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, whatsapp_number: editing.whatsapp_number ?? "",
          transport: editing.transport ?? "", marka: editing.marka ?? "",
          station: editing.station ?? "" }
      : { ...EMPTY_PARTY_FORM }
  );

  // Sync form when editing target changes (e.g. opening a different party to edit)
  useState(() => {
    if (open) {
      setForm(editing
        ? { name: editing.name, whatsapp_number: editing.whatsapp_number ?? "",
            transport: editing.transport ?? "", marka: editing.marka ?? "",
            station: editing.station ?? "" }
        : { ...EMPTY_PARTY_FORM }
      );
    }
  }, [open, editing]);

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Party" : "Add Party"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Identity fields */}
          <div>
            <label className="text-sm font-medium text-zinc-700">Name <span className="text-red-400">*</span></label>
            <Input className="mt-1" placeholder="Party name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">WhatsApp Number</label>
            <Input className="mt-1" placeholder="9876543210"
              value={form.whatsapp_number}
              onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} />
          </div>

          {/* Location / logistics fields — shared with Sub-Party */}
          <div className="pt-1 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 mb-3">Default logistics (can be overridden per sub-party)</p>
            {SHARED_LOCATION_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="text-sm font-medium text-zinc-700">{label}</label>
                <Input className="mt-1" placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name}>
            {editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Parties Table ────────────────────────────────────────────────────────────

function PartiesTable({ parties, isLoading, expanded, onToggleExpand, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead>Name</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>Marka</TableHead>
            <TableHead>Station</TableHead>
            <TableHead className="text-right w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-400 py-10">Loading...</TableCell>
            </TableRow>
          ) : parties.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-zinc-400 py-10">No parties yet.</TableCell>
            </TableRow>
          ) : (
            parties.map(p => (
              <>
                <TableRow key={p.id} className="cursor-pointer" onClick={() => onToggleExpand(p.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {expanded[p.id]
                        ? <ChevronDown size={14} className="text-zinc-400" />
                        : <ChevronRight size={14} className="text-zinc-400" />
                      }
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600">{p.whatsapp_number ?? "—"}</TableCell>
                  <TableCell className="text-zinc-600">{p.transport ?? "—"}</TableCell>
                  <TableCell className="text-zinc-600">{p.marka ?? "—"}</TableCell>
                  <TableCell className="text-zinc-600">{p.station ?? "—"}</TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(p)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => onDelete(p.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expanded[p.id] && <SubPartyRows partyId={p.id} />}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartiesPage() {
  const { data: parties = [], isLoading } = useParties();
  const { create, update, remove }        = usePartyMutations();

  const [expanded, setExpanded] = useState({});
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(null);   // null = create, object = edit

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleOpenCreate = () => { setEditing(null); setOpen(true); };
  const handleOpenEdit   = (p)  => { setEditing(p);  setOpen(true); };

  const handleSave = (form) => {
    if (editing) update.mutate({ id: editing.id, data: form });
    else         create.mutate(form);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Parties"
        description="Manage clients and their branches"
        action={
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus size={14} /> Add Party
          </Button>
        }
      />

      <PartiesTable
        parties={parties}
        isLoading={isLoading}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onEdit={handleOpenEdit}
        onDelete={(id) => remove.mutate(id)}
      />

      <PartyFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSave={handleSave}
      />
    </div>
  );
}