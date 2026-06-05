import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useColors, useColorMutations } from "../../hooks";
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

const COLOR_SWATCHES = {
  red: "#ef4444", blue: "#3b82f6", black: "#18181b",
  white: "#f4f4f5", brown: "#92400e", green: "#22c55e",
  navy: "#1e3a5f", grey: "#71717a", gray: "#71717a",
  beige: "#d4b896", pink: "#ec4899",
};

const getSwatchColor = (name) =>
  COLOR_SWATCHES[name?.toLowerCase()] ?? "#a1a1aa";

export default function ColorsPage() {
  const { data: colors = [], isLoading } = useColors();
  const { create, update, remove }       = useColorMutations();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName]       = useState("");

  const openCreate = () => { setEditing(null); setName(""); setOpen(true); };
  const openEdit   = (color) => { setEditing(color); setName(color.name); setOpen(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      update.mutate({ id: editing.id, data: { name } });
    } else {
      create.mutate({ name });
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this color?")) remove.mutate(id);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Colors"
        description="Manage available shoe colors"
        action={
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus size={14} /> Add Color
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead className="w-12">Swatch</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-400 py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : colors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-400 py-10">
                  No colors yet. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border border-zinc-200"
                      style={{ background: getSwatchColor(color.name) }}
                    />
                  </TableCell>
                  <TableCell className="font-medium capitalize">{color.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(color)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(color.id)}
                        className="text-red-500 hover:text-red-600">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Color" : "Add Color"}</DialogTitle>
          </DialogHeader>
          <div className="py-2 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border border-zinc-200 shrink-0"
              style={{ background: getSwatchColor(name) }}
            />
            <Input
              placeholder="e.g. Red, Navy, Black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}