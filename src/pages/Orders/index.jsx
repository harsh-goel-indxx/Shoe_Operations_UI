import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  useOrders, useOrderMutations, useParties,
  useSubParties, useProducts, useColors,
} from "../../hooks";
import { ordersApi, orderItemsApi } from "../../api";
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
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "../../components/ui/select";

// ─── Constants ────────────────────────────────────────────────────────────────

const PACKING_COLORS = {
  loose: "bg-amber-100 text-amber-800",
  box:   "bg-blue-100 text-blue-800",
  china: "bg-purple-100 text-purple-800",
};

const EMPTY_ITEM = {
  product_id: "", product_name: "", size_min: "", size_max: "",
  quantity: "", packing: "box", color_ids: [],
};

const EMPTY_ORDER_HEADER = {
  partyId: "", subPartyId: "",
  transport: "", marka: "", station: "",
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  const steps = ["Order Details", "Add Items"];
  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((label, idx) => {
        const stepNum  = idx + 1;
        const isActive = currentStep === stepNum;
        const isDone   = currentStep > stepNum;
        return (
          <div key={stepNum} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors
              ${isActive ? "text-zinc-900" : isDone ? "text-zinc-500" : "text-zinc-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                ${isActive ? "bg-zinc-900 text-white" : isDone ? "bg-zinc-400 text-white" : "bg-zinc-100 text-zinc-400"}`}>
                {stepNum}
              </span>
              {label}
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight size={12} className="text-zinc-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Order Header Form ────────────────────────────────────────────────

/**
 * Renders party/sub-party selectors and auto-populates
 * transport, marka, station from the selected party/sub-party.
 */
function OrderHeaderForm({ header, parties, subParties, onChange }) {

  const handlePartyChange = (partyId, allParties) => {
    const party = allParties.find(p => String(p.id) === partyId);
    onChange({
      partyId,
      subPartyId: "",
      transport:  party?.transport ?? "",
      marka:      party?.marka     ?? "",
      station:    party?.station   ?? "",
    });
  };

  const handleSubPartyChange = (subPartyId, allSubParties) => {
    const sub = allSubParties.find(s => String(s.id) === subPartyId);
    onChange({
      ...header,
      subPartyId,
      transport: sub?.transport || header.transport,
      marka:     sub?.marka     || header.marka,
      station:   sub?.station   || header.station,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">Party <span className="text-red-400">*</span></label>
          <Select value={header.partyId} onValueChange={v => handlePartyChange(v, parties)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select party" />
            </SelectTrigger>
            <SelectContent>
              {parties.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Sub-Party</label>
          <Select
            value={header.subPartyId}
            onValueChange={v => handleSubPartyChange(v, subParties)}
            disabled={!header.partyId}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select sub-party" />
            </SelectTrigger>
            <SelectContent>
              {subParties.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">Transport</label>
          <Input className="mt-1" placeholder="e.g. DTDC"
            value={header.transport}
            onChange={e => onChange({ ...header, transport: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Marka</label>
          <Input className="mt-1" placeholder="e.g. RF-001"
            value={header.marka}
            onChange={e => onChange({ ...header, marka: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Station</label>
          <Input className="mt-1" placeholder="e.g. Delhi"
            value={header.station}
            onChange={e => onChange({ ...header, station: e.target.value })}
            disabled />
        </div>
      </div>

      {header.partyId && (
        <p className="text-xs text-zinc-400 mt-1">
          Transport, Marka &amp; Station auto-filled from party. You can override them above.
        </p>
      )}
    </div>
  );
}

// ─── Step 2: Single Order Item Row Form ───────────────────────────────────────

function OrderItemForm({ item, index, colors, products, onUpdate, onRemove }) {
  const product = products.find(p => p.id === item.product_id);

  const productColorIds = new Set(
    (product?.color ?? product?.colors ?? []).map(c => c.id)
  );
  const availableColors = product
    ? colors.filter(c => productColorIds.has(c.id))
    : colors;

  const toggleColor = (id) => {
    const ids = item.color_ids.includes(id)
      ? item.color_ids.filter(c => c !== id)
      : [...item.color_ids, id];
    onUpdate(index, "color_ids", ids);
  };

  /**
   * Batch all product-change side-effects into one state update to avoid
   * the stale-closure bug where sequential onUpdate calls overwrite each other.
   */
  const handleProductChange = (productName) => {
    const p = products.find(pr => pr.name === productName);
    onUpdate(index, "_batch", {
      product_id:   p?.id ?? "",
      product_name: productName,
      size_min:     p?.size_min ?? "",
      size_max:     p?.size_max ?? "",
      color_ids:    [],
    });
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-3 relative">
      <button onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 text-xs">✕</button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600">Product</label>
          <Select value={item.product_name} onValueChange={handleProductChange}>
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Quantity</label>
          <Input className="mt-1 h-8 text-sm" type="number" placeholder="50"
            value={item.quantity}
            onChange={e => onUpdate(index, "quantity", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Min Size {product && <span className="text-zinc-400">({product.size_min}+)</span>}
          </label>
          <Input className="mt-1 h-8 text-sm" type="number"
            min={product?.size_min} max={product?.size_max}
            value={item.size_min}
            onChange={e => onUpdate(index, "size_min", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Max Size {product && <span className="text-zinc-400">(–{product.size_max})</span>}
          </label>
          <Input className="mt-1 h-8 text-sm" type="number"
            min={product?.size_min} max={product?.size_max}
            value={item.size_max}
            onChange={e => onUpdate(index, "size_max", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Packing</label>
          <Select value={item.packing} onValueChange={v => onUpdate(index, "packing", v)}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="loose">Loose</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="china">China</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 block mb-1.5">
          Colors {product && <span className="text-zinc-400">(from product)</span>}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableColors.map(c => (
            <button key={c.id} type="button" onClick={() => toggleColor(c.id)}
              className={`text-xs px-2.5 py-0.5 rounded-full border capitalize transition-colors
                ${item.color_ids.includes(c.id)
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Order Items List ─────────────────────────────────────────────────

function OrderItemsForm({ items, colors, products, onUpdate, onAdd, onRemove }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">Order Items</label>
        <button onClick={onAdd}
          className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1">
          <Plus size={12} /> Add item
        </button>
      </div>
      {items.map((item, i) => (
        <OrderItemForm key={i} item={item} index={i}
          colors={colors} products={products}
          onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

/**
 * Lightweight confirmation dialog before permanently deleting an order.
 * Kept separate so it can be independently updated without touching order form logic.
 */
function DeleteConfirmDialog({ order, onConfirm, onCancel, isDeleting }) {
  return (
    <Dialog open={!!order} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Order #{order?.id}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-600 py-2">
          This will permanently delete the order for <span className="font-medium">{order?.party_name}</span> and
          all its items. This action cannot be undone.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

function OrdersTable({ orders, isLoading, expanded, onToggleExpand, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Sub-Party</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>Marka</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-zinc-400 py-10">Loading...</TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-zinc-400 py-10">No orders yet.</TableCell>
            </TableRow>
          ) : (
            orders.map(order => (
              <>
                <TableRow key={order.id} className="cursor-pointer" onClick={() => onToggleExpand(order.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {expanded[order.id]
                        ? <ChevronDown size={14} className="text-zinc-400" />
                        : <ChevronRight size={14} className="text-zinc-400" />
                      }
                      #{order.id}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600">{order.date}</TableCell>
                  <TableCell className="font-medium">{order.party_name}</TableCell>
                  <TableCell className="text-zinc-600">{order.sub_party_name ?? "—"}</TableCell>
                  <TableCell className="text-zinc-600">{order.transport}</TableCell>
                  <TableCell className="text-zinc-600">{order.marka}</TableCell>
                  <TableCell>
                    <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">
                      {order.items?.length ?? 0} items
                    </span>
                  </TableCell>

                  {/* Action buttons — stop propagation so row expand doesn't trigger */}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => onEdit(order)}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                        title="Edit order"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(order)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete order"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>

                {expanded[order.id] && order.items?.map(item => (
                  <TableRow key={item.id} className="bg-zinc-50/50">
                    <TableCell colSpan={2} />
                    <TableCell className="text-sm text-zinc-700">↳ {item.product_name}</TableCell>
                    <TableCell className="text-sm text-zinc-500">Size {item.size_min}–{item.size_max}</TableCell>
                    <TableCell className="text-sm text-zinc-500">Qty: {item.quantity}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PACKING_COLORS[item.packing]}`}>
                        {item.packing}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.color?.map(c => (
                          <span key={c.id}
                            className="text-xs px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded capitalize">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Order Form Dialog (shared by Create and Edit) ────────────────────────────

/**
 * Two-step dialog used for both creating and editing orders.
 *
 * When `editOrder` is provided:
 *   - Header fields are pre-populated from the existing order
 *   - Items are pre-populated from order.items (mapped to local EMPTY_ITEM shape)
 *   - Submit patches the order header via ordersApi.update, then:
 *       • Deletes removed items (present in original, absent in current)
 *       • Creates new items (no id yet)
 *       • Updates existing items that were modified (have an id)
 *
 * When `editOrder` is null, behaves exactly as before (create flow).
 */
function OrderFormDialog({ open, onOpenChange, parties, products, colors, editOrder }) {
  const { create, update, remove } = useOrderMutations();

  const isEditMode = !!editOrder;

  // ── Derive initial state from editOrder when present ─────────────────────

  const buildInitialHeader = (order) => {
    if (!order) return { ...EMPTY_ORDER_HEADER };
    return {
      partyId:    String(order.party),
      subPartyId: order.sub_party ? String(order.sub_party) : "",
      transport:  order.transport ?? "",
      marka:      order.marka     ?? "",
      station:    "",   // not returned by Orders serializer; filled from party on edit open
    };
  };

  /**
   * Map existing OrderItems (from the API) back into the local EMPTY_ITEM shape
   * so they render correctly inside OrderItemForm.
   * Preserves the item `id` so we can PATCH vs POST on submit.
   */
  const buildInitialItems = (order) => {
    if (!order?.items?.length) return [{ ...EMPTY_ITEM }];
    return order.items.map(item => ({
      id:           item.id,                   // existing DB id — used to decide PATCH vs POST
      product_id:   item.product,              // FK int
      product_name: item.product_name ?? "",   // read-only display field from serializer
      size_min:     item.size_min,
      size_max:     item.size_max,
      quantity:     item.quantity,
      packing:      item.packing,
      color_ids:    (item.color ?? []).map(c => c.id),
    }));
  };

  const [step, setStep]         = useState(1);
  const [header, setHeader]     = useState(() => buildInitialHeader(editOrder));
  const [items, setItems]       = useState(() => buildInitialItems(editOrder));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subParties = [] } = useSubParties(header.partyId || null);

  // Re-populate state whenever the dialog opens with a different order
  // (covers switching from one edit target to another without unmounting)
  useState(() => {
    if (open) {
      setStep(1);
      setHeader(buildInitialHeader(editOrder));
      setItems(buildInitialItems(editOrder));
    }
  }, [open, editOrder]);

  // ── Item helpers ──────────────────────────────────────────────────────────

  const updateItem = (index, key, value) =>
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (key === "_batch") return { ...item, ...value };
      return { ...item, [key]: value };
    }));

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  // ── Dialog close & reset ──────────────────────────────────────────────────

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setHeader({ ...EMPTY_ORDER_HEADER });
      setItems([{ ...EMPTY_ITEM }]);
    }, 300);
  };

  // ── Submit: create path ───────────────────────────────────────────────────

  const handleCreate = async () => {
    const orderRes = await ordersApi.create({
      party:     Number(header.partyId),
      sub_party: header.subPartyId ? Number(header.subPartyId) : null,
      transport: header.transport,
      marka:     header.marka,
    });
    const orderId = orderRes.data.id;

    for (const item of items) {
      await orderItemsApi.create({
        order:    orderId,
        product:  item.product_id,
        size_min: Number(item.size_min),
        size_max: Number(item.size_max),
        quantity: Number(item.quantity),
        packing:  item.packing,
        color_id: item.color_ids,
      });
    }
    create.mutate();
  };

  // ── Submit: edit path ─────────────────────────────────────────────────────

  const handleUpdate = async () => {
    // 1. Patch the Order header fields
    await ordersApi.update(editOrder.id, {
      party:     Number(header.partyId),
      sub_party: header.subPartyId ? Number(header.subPartyId) : null,
      transport: header.transport,
      marka:     header.marka,
    });

    const originalItemIds = new Set((editOrder.items ?? []).map(i => i.id));
    const currentItemIds  = new Set(items.filter(i => i.id).map(i => i.id));

    // 2. Delete items that were removed in the form
    const deletedIds = [...originalItemIds].filter(id => !currentItemIds.has(id));
    for (const id of deletedIds) {
      await orderItemsApi.delete(id);
    }

    // 3. Update existing items / create new ones
    for (const item of items) {
      const payload = {
        order:    editOrder.id,
        product:  item.product_id,
        size_min: Number(item.size_min),
        size_max: Number(item.size_max),
        quantity: Number(item.quantity),
        packing:  item.packing,
        color_id: item.color_ids,
      };

      if (item.id) {
        await orderItemsApi.update(item.id, payload);   // existing → PATCH
      } else {
        await orderItemsApi.create(payload);             // new → POST
      }
    }
    update.mutate();
  };

  // ── Unified submit handler ────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await handleUpdate();
      } else {
        await handleCreate();
      }
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = !!header.partyId;
  const isStep2Valid = items.length > 0 && items.every(i => i.product_id && i.quantity);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? `Edit Order #${editOrder.id}` : "New Order"}</DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="py-2">
          {step === 1 ? (
            <OrderHeaderForm
              header={header}
              parties={parties}
              subParties={subParties}
              onChange={setHeader}
            />
          ) : (
            <OrderItemsForm
              items={items}
              colors={colors}
              products={products}
              onUpdate={updateItem}
              onAdd={addItem}
              onRemove={removeItem}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => setStep(2)} disabled={!isStep1Valid} className="gap-2">
                Next: Add Items <ArrowRight size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={!isStep2Valid || isSubmitting}>
                {isSubmitting
                  ? (isEditMode ? "Saving..." : "Placing...")
                  : (isEditMode ? "Save Changes" : "Place Order")
                }
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { remove }                       = useOrderMutations();
  const { data: parties = [] }           = useParties();
  const { data: products = [] }          = useProducts();
  const { data: colors = [] }            = useColors();

  const [expanded, setExpanded]         = useState({});
  const [formOpen, setFormOpen]         = useState(false);
  const [editOrder, setEditOrder]       = useState(null);   // null = create, object = edit
  const [deleteTarget, setDeleteTarget] = useState(null);   // order to confirm-delete
  const [isDeleting, setIsDeleting]     = useState(false);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // ── Open create dialog ────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditOrder(null);
    setFormOpen(true);
  };

  // ── Open edit dialog pre-populated with existing order ────────────────────

  const handleOpenEdit = (order) => {
    setEditOrder(order);
    setFormOpen(true);
  };

  // ── Delete flow ───────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await ordersApi.remove(deleteTarget.id);
      remove.mutate();
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Orders"
        description="Track all shoe orders"
        action={
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus size={14} /> New Order
          </Button>
        }
      />

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onEdit={handleOpenEdit}
        onDelete={setDeleteTarget}
      />

      <OrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parties={parties}
        products={products}
        colors={colors}
        editOrder={editOrder}
      />

      <DeleteConfirmDialog
        order={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}