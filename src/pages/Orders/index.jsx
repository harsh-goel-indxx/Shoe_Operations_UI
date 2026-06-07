import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
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
      // Sub-party values override party defaults when present
      transport: sub?.transport || header.transport,
      marka:     sub?.marka     || header.marka,
      station:   sub?.station   || header.station,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">

        {/* Party */}
        <div>
          <label className="text-sm font-medium text-zinc-700">Party <span className="text-red-400">*</span></label>
          <Select
            value={header.partyId}
            onValueChange={v => handlePartyChange(v, parties)}
          >
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

        {/* Sub-Party */}
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

      {/* Auto-fetched + editable fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">Transport</label>
          <Input
            className="mt-1" placeholder="e.g. DTDC"
            value={header.transport}
            onChange={e => onChange({ ...header, transport: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Marka</label>
          <Input
            className="mt-1" placeholder="e.g. RF-001"
            value={header.marka}
            onChange={e => onChange({ ...header, marka: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700">Station</label>
          <Input
            className="mt-1" placeholder="e.g. Delhi"
            value={header.station}
            onChange={e => onChange({ ...header, station: e.target.value })}
            disabled  // station is informational only; remove disabled if editable
          />
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

  /**
   * Resolve colors for the selected product.
   * Django serializes the M2M field as either:
   *   product.color  → array of { id, name }  (DRF nested serializer)
   *   product.colors → same, alternate key
   * We check both and fall back to all colors when no product is selected.
   */
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
      product_id: p?.id ?? "",
      product_name: productName,
      size_min:  p?.size_min ?? "",
      size_max:  p?.size_max ?? "",
      color_ids: [],
    });
  };

  return (
    <div className="border border-zinc-200 rounded-lg p-4 space-y-3 relative">
      <button
        onClick={() => onRemove(index)}
        className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 text-xs"
      >
        ✕
      </button>

      <div className="grid grid-cols-2 gap-3">
        {/* Product */}
        <div>
          <label className="text-xs font-medium text-zinc-600">Product</label>
          <Select
            value={item.product_name}
            onValueChange={handleProductChange}
          >
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

        {/* Quantity */}
        <div>
          <label className="text-xs font-medium text-zinc-600">Quantity</label>
          <Input
            className="mt-1 h-8 text-sm" type="number" placeholder="50"
            value={item.quantity}
            onChange={e => onUpdate(index, "quantity", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Min Size */}
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Min Size {product && <span className="text-zinc-400">({product.size_min}+)</span>}
          </label>
          <Input
            className="mt-1 h-8 text-sm" type="number"
            min={product?.size_min} max={product?.size_max}
            value={item.size_min}
            onChange={e => onUpdate(index, "size_min", e.target.value)}
          />
        </div>

        {/* Max Size */}
        <div>
          <label className="text-xs font-medium text-zinc-600">
            Max Size {product && <span className="text-zinc-400">(–{product.size_max})</span>}
          </label>
          <Input
            className="mt-1 h-8 text-sm" type="number"
            min={product?.size_min} max={product?.size_max}
            value={item.size_max}
            onChange={e => onUpdate(index, "size_max", e.target.value)}
          />
        </div>

        {/* Packing */}
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

      {/* Colors */}
      <div>
        <label className="text-xs font-medium text-zinc-600 block mb-1.5">
          Colors {product && <span className="text-zinc-400">(from product)</span>}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableColors.map(c => (
            <button
              key={c.id} type="button" onClick={() => toggleColor(c.id)}
              className={`text-xs px-2.5 py-0.5 rounded-full border capitalize transition-colors
                ${item.color_ids.includes(c.id)
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
            >
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
        <button
          onClick={onAdd}
          className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
        >
          <Plus size={12} /> Add item
        </button>
      </div>
      {items.map((item, i) => (
        <OrderItemForm
          key={i} item={item} index={i}
          colors={colors} products={products}
          onUpdate={onUpdate} onRemove={onRemove}
        />
      ))}
    </div>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────

function OrdersTable({ orders, isLoading, expanded, onToggleExpand }) {
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-400 py-10">Loading...</TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-zinc-400 py-10">No orders yet.</TableCell>
            </TableRow>
          ) : (
            orders.map(order => (
              <>
                <TableRow
                  key={order.id} className="cursor-pointer"
                  onClick={() => onToggleExpand(order.id)}
                >
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
                </TableRow>

                {expanded[order.id] && order.items?.map(item => (
                  <TableRow key={item.id} className="bg-zinc-50/50">
                    <TableCell colSpan={2} />
                    <TableCell className="text-sm text-zinc-700">↳ {item.product_name}</TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      Size {item.size_min}–{item.size_max}
                    </TableCell>
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

// ─── New Order Dialog ─────────────────────────────────────────────────────────

/**
 * Two-step dialog:
 *   Step 1 → Fill Order header (party, sub-party, transport, marka, station)
 *   Step 2 → Add OrderItems; on submit, creates Order first then links items
 */
function NewOrderDialog({ open, onOpenChange, parties, products, colors }) {
  const { create } = useOrderMutations();

  const [step, setStep]       = useState(1);
  const [header, setHeader]   = useState({ ...EMPTY_ORDER_HEADER });
  const [items, setItems]     = useState([{ ...EMPTY_ITEM }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subParties = [] } = useSubParties(header.partyId || null);

  // ── Item helpers ──────────────────────────────────────────────────────────

  const updateItem = (index, key, value) =>
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      // "_batch" allows atomically patching multiple fields at once,
      // preventing stale-closure bugs from sequential single-key updates.
      if (key === "_batch") return { ...item, ...value };
      return { ...item, [key]: value };
    }));

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

  // ── Dialog close & reset ──────────────────────────────────────────────────

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep(1);
      setHeader({ ...EMPTY_ORDER_HEADER });
      setItems([{ ...EMPTY_ITEM }]);
    }, 300);
  };

  // ── Step 1 → Step 2 ───────────────────────────────────────────────────────

  const handleProceedToItems = () => setStep(2);
  const handleBackToHeader   = () => setStep(1);

  // ── Final submit: Order first, then OrderItems ────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create the Order record
      const orderRes = await ordersApi.create({
        party:     Number(header.partyId),
        sub_party: header.subPartyId ? Number(header.subPartyId) : null,
        transport: header.transport,
        marka:     header.marka,
      });
      const orderId = orderRes.data.id;

      // 2. Create each OrderItem linked to the order
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

      create.mutate();   // invalidate/refetch orders list
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
          <DialogTitle>New Order</DialogTitle>
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
              <Button
                onClick={handleProceedToItems}
                disabled={!isStep1Valid}
                className="gap-2"
              >
                Next: Add Items <ArrowRight size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBackToHeader} className="gap-2">
                <ArrowLeft size={14} /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isStep2Valid || isSubmitting}
              >
                {isSubmitting ? "Placing..." : "Place Order"}
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
  const { data: parties = [] }           = useParties();
  const { data: products = [] }          = useProducts();
  const { data: colors = [] }            = useColors();

  const [open, setOpen]         = useState(false);
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="p-8">
      <PageHeader
        title="Orders"
        description="Track all shoe orders"
        action={
          <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
            <Plus size={14} /> New Order
          </Button>
        }
      />

      <OrdersTable
        orders={orders}
        isLoading={isLoading}
        expanded={expanded}
        onToggleExpand={toggleExpand}
      />

      <NewOrderDialog
        open={open}
        onOpenChange={setOpen}
        parties={parties}
        products={products}
        colors={colors}
      />
    </div>
  );
}