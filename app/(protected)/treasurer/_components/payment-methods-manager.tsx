"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, ImageUp, QrCode, Trash2 } from "lucide-react";
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
    <div className="flex flex-col gap-5">
      {!uploadsEnabled && (
        <p className="rounded-3xl bg-accent px-4 py-3 text-sm text-accent-foreground">
          QR uploads need Cloudinary credentials on the server. You can still
          enter account details and accept cash; add the credentials to enable
          image uploads.
        </p>
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
        ),
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
    <section className="overflow-hidden rounded-4xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-muted text-foreground">
            {icon}
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={switchId} className="text-xs text-muted-foreground">
            {enabled ? "On" : "Off"}
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
      <div className="border-t border-border px-5 py-5">{children}</div>
      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-5 py-3">
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

  // Track the live object URL so we can revoke it when it's replaced and on
  // unmount, without creating object URLs from inside an effect.
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
    [],
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
        `Add the account name, number, and a QR code before turning ${label} on.`,
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
      icon={<QrCode className="size-5" />}
      title={label}
      hint="E-wallet transfer via QR code"
      enabled={enabled}
      onToggle={setEnabled}
      disabled={saving}
      footer={
        <Button onClick={save} disabled={saving}>
          {saving && <Spinner />}
          Save {label}
        </Button>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Account name</Label>
            <Input
              id={nameId}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Barangay Libtangin Treasury"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={numberId}>Account number</Label>
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
                className="size-40 rounded-3xl border border-border bg-white object-contain p-2"
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={saving || !uploadsEnabled}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeQr}
                  disabled={saving}
                >
                  <Trash2 className="text-destructive" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving || !uploadsEnabled}
              className={cn(
                "flex size-40 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50",
              )}
            >
              <ImageUp className="size-6" aria-hidden />
              {uploadsEnabled ? "Upload QR code" : "Uploads disabled"}
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
    toast.success("Cash saved.");
    router.refresh();
  };

  return (
    <ChannelShell
      icon={<Banknote className="size-5" />}
      title="Cash"
      hint="Paid in person at the barangay hall"
      enabled={enabled}
      onToggle={setEnabled}
      disabled={saving}
      footer={
        <Button onClick={save} disabled={saving}>
          {saving && <Spinner />}
          Save cash
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={instructionsId}>Instructions for residents</Label>
        <Textarea
          id={instructionsId}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Pay at the barangay hall, window 2. Open Monday to Friday, 8:00 AM to 5:00 PM. Bring the exact amount and your reference slip."
          rows={3}
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">
          Shown to residents who choose to pay in cash.
        </p>
      </div>
    </ChannelShell>
  );
}
