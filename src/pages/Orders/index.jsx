  import { useState } from "react";
  import { Plus, ChevronDown, ChevronRight } from "lucide-react";
  import { useOrders, useOrderMutations, useParties, useSubParties, useProducts, useColors } from "../../hooks";
  import { ordersApi, orderItemsApi } from "../../api";
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

  const PACKING_COLORS = {
    loose: "bg-amber-100 text-amber-800",
    box:   "bg-blue-100 text-blue-800",
    china: "bg-purple-100 text-purple-800",
  };

  const EMPTY_ITEM = {
    name: "", size_min: "", size_max: "",
    quantity: "", packing: "box", color_ids: [],
  };

  function OrderItemForm({ item, index, colors, products, onUpdate, onRemove }) {
    const product = products.find(p => p.name === item.name);
    console.log(item, products)
    const availableColors = product
      ? colors.filter(c => product.colors?.some(pc => pc.id === c.id))
      : colors;

    const handleSizeMin = (val) => {
      const min = Number(val);
      const max = product ? Math.min(Number(item.size_max || product.size_max), product.size_max) : Number(item.size_max);
      onUpdate(index, "size_min", Math.max(product?.size_min ?? 1, min));
    };

    const toggleColor = (id) => {
      const ids = item.color_ids.includes(id)
        ? item.color_ids.filter(c => c !== id)
        : [...item.color_ids, id];
      onUpdate(index, "color_ids", ids);
    };

    return (
      <div className="border border-zinc-200 rounded-lg p-4 space-y-3 relative">
        <button onClick={() => onRemove(index)}
          className="absolute top-3 right-3 text-zinc-400 hover:text-red-500 text-xs">✕</button>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">Product</label>
            <Select value={item.name} onValueChange={v => {
              const p = products.find(pr => pr.name === v);
              onUpdate(index, "name", v);
              if (p) {
                onUpdate(index, "size_min", p.size_min);
                onUpdate(index, "size_max", p.size_max);
                onUpdate(index, "color_ids", []);
              }
            }}>
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
              value={item.quantity} onChange={e => onUpdate(index, "quantity", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-600">
              Min Size {product && <span className="text-zinc-400">({product.size_min}+)</span>}
            </label>
            <Input className="mt-1 h-8 text-sm" type="number"
              min={product?.size_min} max={product?.size_max}
              value={item.size_min} onChange={e => onUpdate(index, "size_min", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">
              Max Size {product && <span className="text-zinc-400">(–{product.size_max})</span>}
            </label>
            <Input className="mt-1 h-8 text-sm" type="number"
              min={product?.size_min} max={product?.size_max}
              value={item.size_max} onChange={e => onUpdate(index, "size_max", e.target.value)} />
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

  export default function OrdersPage() {
    const { data: orders = [], isLoading } = useOrders();
    const { create }                       = useOrderMutations();
    const { data: parties = [] }           = useParties();
    const { data: products = [] }          = useProducts();
    const { data: colors = [] }            = useColors();

    const [open, setOpen]         = useState(false);
    const [expanded, setExpanded] = useState({});
    const [partyId, setPartyId]   = useState("");
    const [subPartyId, setSubPartyId] = useState("");
    const [transport, setTransport]   = useState("");
    const [marka, setMarka]           = useState("");
    const [items, setItems]           = useState([{ ...EMPTY_ITEM }]);

    const { data: subParties = [] } = useSubParties(partyId || null);

    const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

    const updateItem = (index, key, value) => {
      setItems(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
    };

    const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
    const removeItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
      const createdItemIds = [];
      for (const item of items) {
        const res = await orderItemsApi.create({
          name:      item.name,
          size_min:  Number(item.size_min),
          size_max:  Number(item.size_max),
          quantity:  Number(item.quantity),
          packing:   item.packing,
          color_ids: item.color_ids,
        });
        createdItemIds.push(res.data.id);
      }
      create.mutate({
        party:             Number(partyId),
        sub_party:         subPartyId ? Number(subPartyId) : null,
        transport,
        marka,
        product_order_ids: createdItemIds,
      });
      setOpen(false);
      setItems([{ ...EMPTY_ITEM }]);
      setPartyId(""); setSubPartyId(""); setTransport(""); setMarka("");
    };

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
                    <TableRow key={order.id} className="cursor-pointer"
                      onClick={() => toggleExpand(order.id)}>
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
                        <TableCell className="text-sm text-zinc-700">↳ {item.name}</TableCell>
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
                            {item.colors?.map(c => (
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

        {/* New Order Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Order</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Party</label>
                  <Select value={partyId} onValueChange={v => { setPartyId(v); setSubPartyId(""); }}>
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
                  <Select value={subPartyId} onValueChange={setSubPartyId} disabled={!partyId}>
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
                <div>
                  <label className="text-sm font-medium text-zinc-700">Transport</label>
                  <Input className="mt-1" placeholder="e.g. DTDC"
                    value={transport} onChange={e => setTransport(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Marka</label>
                  <Input className="mt-1" placeholder="e.g. RF-001"
                    value={marka} onChange={e => setMarka(e.target.value)} />
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-zinc-700">Order Items</label>
                  <button onClick={addItem}
                    className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1">
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <OrderItemForm key={i} item={item} index={i}
                      colors={colors} products={products}
                      onUpdate={updateItem} onRemove={removeItem} />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}
                disabled={!partyId || items.some(i => !i.name || !i.quantity)}>
                Place Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }