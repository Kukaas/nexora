"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Banknote, ImageUp, QrCode, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { PaymentMethodType } from "@/app/generated/prisma/enums";
import { METHOD_LABELS, type PaymentMethodDTO } from "@/lib/payments";
import { savePaymentMethod } from "@/lib/treasurer-actions";

export function PaymentMethodsManager({
  methods,
  uploadsEnabled,
}: {
  methods: PaymentMethodDTO[];
  uploadsEnabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {!uploadsEnabled && (
        <div className="flex items-center gap-3 rounded-4xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-sm">
          <AlertCircle className="size-5 shrink-0" />
          <span>
            QR image uploads require Cloudinary environment credentials. Account names, numbers, and cash desk instructions can still be configured and accepted.
          </span>
        </div>
      )}
      {methods.map((method) =>
        method.type === PaymentMethodType.CASH ? (
          <CashChannel key={method.type} method={method} />
        ) : (
          <EwalletChannel
            key={method.type}
            method={method}
            uploadsEnabled={uploadsEnabled}
          />
        )
      )}
    </div>
  );
}

function ChannelShell({
  icon,
  title,
  hint,
  enabled,
  onToggle,
  disabled,
  children,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const switchId = useId();
  return (
    <section className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={switchId} className="text-xs font-medium text-muted-foreground">
            {enabled ? "Accepting" : "Disabled"}
          </Label>
          <Switch
            id={switchId}
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
            aria-label={`Accept ${title}`}
          />
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 p-4 sm:px-6">
        {footer}
      </div>
    </section>
  );
}

function EwalletChannel({
  method,
  uploadsEnabled,
}: {
  method: PaymentMethodDTO;
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const nameId = useId();
  const numberId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [enabled, setEnabled] = useState(method.enabled);
  const [accountName, setAccountName] = useState(method.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState(method.accountNumber ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(method.qrImage);
  const [saving, setSaving] = useState(false);

  const blobUrlRef = useRef<string | null>(null);
  const showBlob = (next: File | null) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (next) {
      const url = URL.createObjectURL(next);
      blobUrlRef.current = url;
      setPreview(url);
    } else {
      setPreview(null);
    }
  };
  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  const label = METHOD_LABELS[method.type];

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (next && !next.type.startsWith("image/")) {
      toast.error("The QR code must be an image file.");
      return;
    }
    setFile(next);
    showBlob(next);
  };

  const removeQr = () => {
    setFile(null);
    showBlob(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    if (enabled && (!accountName.trim() || !accountNumber.trim() || !preview)) {
      toast.error(
        `Add the account name, number, and a QR code before turning ${label} on.`
      );
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.set("type", method.type);
    fd.set("enabled", String(enabled));
    fd.set("accountName", accountName);
    fd.set("accountNumber", accountNumber);
    if (file) fd.set("qr", file);
    const result = await savePaymentMethod(fd);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${label} saved.`);
    router.refresh();
  };

  return (
    <ChannelShell
      icon={<QrCode className="size-4.5" />}
      title={label}
      hint="E-wallet transfer via QR code and account details"
      enabled={enabled}
      onToggle={setEnabled}
      disabled={saving}
      footer={
        <Button onClick={save} disabled={saving} className="rounded-2xl font-semibold">
          {saving ? <Spinner /> : <Save className="mr-1.5 size-4" />}
          Save {label} Channel
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Account Name</Label>
            <Input
              id={nameId}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Barangay Libtangin Treasury"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={numberId}>Account / Mobile Number</Label>
            <Input
              id={numberId}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0917 123 4567"
              inputMode="numeric"
              disabled={saving}
              className="font-mono"
            />
          </div>
        </div>

        {/* QR uploader / preview */}
        <div className="flex flex-col items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            disabled={saving || !uploadsEnabled}
            className="sr-only"
            aria-label={`${label} QR code image`}
          />
          {preview ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`${label} QR code`}
                className="size-44 rounded-3xl border border-border bg-white object-contain p-3 shadow-xs"
              />
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving || !uploadsEnabled}
                  className="rounded-2xl text-xs h-8"
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeQr}
                  disabled={saving}
                  className="rounded-2xl text-xs h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving || !uploadsEnabled}
              className="flex size-44 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors p-4 text-center text-xs text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
            >
              <ImageUp className="size-6 text-primary" aria-hidden />
              {uploadsEnabled ? "Upload QR Code Image" : "QR Uploads Disabled"}
            </button>
          )}
        </div>
      </div>
    </ChannelShell>
  );
}

function CashChannel({ method }: { method: PaymentMethodDTO }) {
  const router = useRouter();
  const instructionsId = useId();
  const [enabled, setEnabled] = useState(method.enabled);
  const [instructions, setInstructions] = useState(method.instructions ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.set("type", PaymentMethodType.CASH);
    fd.set("enabled", String(enabled));
    fd.set("instructions", instructions);
    const result = await savePaymentMethod(fd);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Cash channel saved.");
    router.refresh();
  };

  return (
    <ChannelShell
      icon={<Banknote className="size-4.5" />}
      title="Cash at Barangay Hall Desk"
      hint="In-person cash payment at the barangay treasury counter"
      enabled={enabled}
      onToggle={setEnabled}
      disabled={saving}
      footer={
        <Button onClick={save} disabled={saving} className="rounded-2xl font-semibold">
          {saving ? <Spinner /> : <Save className="mr-1.5 size-4" />}
          Save Cash Channel
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={instructionsId}>Instructions for Residents</Label>
        <Textarea
          id={instructionsId}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Pay at the barangay hall, Treasury Window 2. Open Monday to Friday, 8:00 AM to 5:00 PM. Please bring the exact amount and present your reference slip."
          rows={3}
          disabled={saving}
          className="min-h-[100px] resize-y"
        />
        <p className="text-xs text-muted-foreground">
          These payment instructions are displayed to residents who select the cash payment method.
        </p>
      </div>
    </ChannelShell>
  );
}
