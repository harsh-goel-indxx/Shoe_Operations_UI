import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useProducts, useProductMutations, useColors } from "../../hooks";
import PageHeader from "../../components/shared/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../../components/ui/table";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../components/ui/select";

const PACKING_LABELS = { loose: "Loose", box: "Box", china: "China Packing" };
const PACKING_COLORS = {
  loose: "bg-amber-100 text-amber-800",
  box:   "bg-blue-100 text-blue-800",
  china: "bg-purple-100 text-purple-800",
};

const EMPTY_FORM = {
  name: "", size_min: "", size_max: "",
  packing: "box", color_ids: [], opening_balance: "",
};

export default function ProductsPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: colors = [] }              = useColors();
  const { create, update, remove }         = useProductMutations();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name:            product.name,
      size_min:        product.size_min,
      size_max:        product.size_max,
      packing:         product.packing,
      color_ids:       product.colors?.map(c => c.id) ?? [],
      opening_balance: product.opening_balance ?? "",
    });
    setOpen(true);
  };

  const handleField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleColor = (id) => {
    setForm(f => ({
      ...f,
      color_ids: f.color_ids.includes(id)
        ? f.color_ids.filter(c => c !== id)
        : [...f.color_ids, id],
    }));
  };

  const handleSave = () => {
    const payload = {
      ...form,
      size_min:        Number(form.size_min),
      size_max:        Number(form.size_max),
      opening_balance: form.opening_balance ? Number(form.opening_balance) : null,
    };
    if (editing) {
      update.mutate({ id: editing.id, data: payload });
    } else {
      create.mutate(payload);
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this product?")) remove.mutate(id);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Products"
        description="Manage your shoe catalog"
        action={
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus size={14} /> Add Product
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Name</TableHead>
              <TableHead>Sizes</TableHead>
              <TableHead>Colors</TableHead>
              <TableHead>Packing</TableHead>
              <TableHead>Opening Bal.</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-400 py-10">Loading...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-400 py-10">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-zinc-600">
                    {p.size_min} – {p.size_max}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.colors?.map(c => (
                        <span key={c.id}
                          className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 capitalize">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PACKING_COLORS[p.packing]}`}>
                      {PACKING_LABELS[p.packing]}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-600">{p.opening_balance ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(p.id)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-zinc-700">Name</label>
              <Input className="mt-1" placeholder="e.g. Nike Air Force"
                value={form.name} onChange={e => handleField("name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-zinc-700">Min Size</label>
                <Input className="mt-1" type="number" placeholder="6"
                  value={form.size_min} onChange={e => handleField("size_min", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700">Max Size</label>
                <Input className="mt-1" type="number" placeholder="11"
                  value={form.size_max} onChange={e => handleField("size_max", e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">Packing</label>
              <Select value={form.packing} onValueChange={v => handleField("packing", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loose">Loose</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="china">China Packing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700 block mb-2">Available Colors</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => toggleColor(c.id)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize
                      ${form.color_ids.includes(c.id)
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">Opening Balance</label>
              <Input className="mt-1" type="number" placeholder="0"
                value={form.opening_balance}
                onChange={e => handleField("opening_balance", e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.size_min || !form.size_max}>
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}