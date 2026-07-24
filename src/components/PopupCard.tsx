import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock3, MapPin, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Community } from "@/types/community";

type SavedCommunityNote = {
  id: string;
  communityId: string;
  communityName: string;
  address: string;
  note: string;
  score: number;
  savedAt: string;
};

type PopupCardProps = {
  community?: Community;
  history: SavedCommunityNote[];
  onClose: () => void;
  onChange: (community: Community) => void;
  onSave: (community: Community) => Promise<void>;
  onSaveEdit: (community: Community) => Promise<void>;
  onDelete: (community: Community) => Promise<void>;
};

export function PopupCard({ community, history, onClose, onChange, onSave, onSaveEdit, onDelete }: PopupCardProps) {
  const [draft, setDraft] = useState<Community | undefined>(community);
  const [isEditing, setIsEditing] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editState, setEditState] = useState<"idle" | "saving" | "error">("idle");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "error">("idle");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setDraft(community);
    setIsEditing(false);
    setSaveState("idle");
    setEditState("idle");
    setDeleteState("idle");
    setShowHistory(false);
  }, [community?.id]);

  if (!community || !draft) return null;

  const updateLive = (patch: Partial<Community>) => {
    setSaveState("idle");
    onChange({ ...community, ...patch });
  };

  const updateDraft = (patch: Partial<Community>) => {
    setEditState("idle");
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const applyDraft = async () => {
    setEditState("saving");
    try {
      await onSaveEdit(draft);
      setEditState("idle");
      setIsEditing(false);
    } catch {
      setEditState("error");
    }
  };

  const cancelEdit = () => {
    setDraft(community);
    setEditState("idle");
    setIsEditing(false);
  };

  const saveNote = async () => {
    setSaveState("saving");
    try {
      await onSave(community);
      setSaveState("saved");
      setShowHistory(true);
    } catch {
      setSaveState("error");
    }
  };

  const deleteCommunity = async () => {
    if (!window.confirm(`是否確定刪除：${community.name}`)) return;
    setDeleteState("deleting");
    try {
      await onDelete(community);
    } catch {
      setDeleteState("error");
    }
  };

  return (
    <Card
      className="absolute bottom-4 right-4 z-[700] max-h-[calc(100%-2rem)] overflow-auto bg-card/95 p-4 shadow-2xl backdrop-blur"
      style={{ width: "min(460px, calc(100% - 2rem))" }}
    >
      <div className={isEditing ? "mb-4 flex flex-col gap-3" : "mb-4 flex items-start justify-between gap-4"}>
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setIsEditing(false)}>
              檢視
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 border-red-300 text-red-600 hover:bg-red-50"
              onClick={deleteCommunity}
              disabled={deleteState === "deleting"}
            >
              {deleteState === "deleting" ? "刪除中" : "刪除"}
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="關閉">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <div className={isEditing ? "order-2 min-w-0" : "min-w-0 flex-1"}>
          {isEditing ? (
            <div className="space-y-3">
              <Field label="名稱">
                <Input
                  value={draft.name}
                  className="text-[15px]"
                  style={{ width: "100%" }}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
              </Field>
              <Field label="地址">
                <Input
                  value={draft.address}
                  className="text-[15px]"
                  style={{ width: "100%" }}
                  onChange={(event) => updateDraft({ address: event.target.value })}
                />
              </Field>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold leading-tight">{community.name}</h2>
              <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="block min-w-0 truncate whitespace-nowrap">{community.address}</span>
              </p>
            </>
          )}
        </div>

        {!isEditing ? (
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? "檢視" : "修改"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 border-red-300 text-red-600 hover:bg-red-50"
            onClick={deleteCommunity}
            disabled={deleteState === "deleting"}
          >
            {deleteState === "deleting" ? "刪除中" : "刪除"}
          </Button>
          <Button type="button" size="icon" variant="outline" onClick={onClose} aria-label="關閉">
            <X className="h-4 w-4" />
          </Button>
        </div>
        ) : null}
      </div>

      {deleteState === "error" ? <p className="mb-3 text-xs text-red-600">刪除失敗，請再試一次</p> : null}

      {isEditing ? (
        <EditFields draft={draft} editState={editState} onChange={updateDraft} onApply={applyDraft} onCancel={cancelEdit} />
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <Metric label="開價" value={community.pricePerPing} />
            <Metric label="屋齡" value={community.age} />
            <Metric label="評分" value={community.score ? `${community.score}/5` : "-"} />
          </dl>

          <section className="mt-4 rounded-lg border border-border bg-white p-3">
            <h3 className="text-sm font-bold">來源地址</h3>
            {community.sourceUrl ? (
              <a className="mt-1 block break-all text-sm text-primary underline-offset-2 hover:underline" href={community.sourceUrl} target="_blank" rel="noreferrer">
                {community.sourceUrl}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">尚未輸入來源地址</p>
            )}
          </section>
        </>
      )}

      <section className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold">評分</h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <Button key={score} type="button" size="icon" variant="outline" onClick={() => updateLive({ score: community.score === score ? 0 : score })}>
                <Star className={cn("h-4 w-4", score <= community.score && "fill-amber-500 text-amber-500")} />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold">看房筆記</h3>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setShowHistory((value) => !value)}>
              <Clock3 className="h-3.5 w-3.5" />
              過去紀錄
            </Button>
          </div>
          <Textarea value={community.note} onChange={(event) => updateLive({ note: event.target.value })} placeholder="輸入看房心得、缺點、待確認事項..." />
        </div>

        {showHistory ? <NoteHistory entries={history} /> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {saveState === "saved" ? "已儲存到 JSON 檔" : null}
            {saveState === "error" ? "儲存失敗，請再試一次" : null}
          </p>
          <Button type="button" onClick={saveNote} disabled={saveState === "saving"}>
            {saveState === "saving" ? "儲存中..." : "儲存筆記"}
          </Button>
        </div>
      </section>
    </Card>
  );
}

function EditFields({
  draft,
  editState,
  onChange,
  onApply,
  onCancel
}: {
  draft: Community;
  editState: "idle" | "saving" | "error";
  onChange: (patch: Partial<Community>) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="開價">
          <Input value={draft.pricePerPing} onChange={(event) => onChange({ pricePerPing: event.target.value })} />
        </Field>
        <Field label="屋齡">
          <Input value={draft.age} onChange={(event) => onChange({ age: event.target.value })} />
        </Field>
      </div>
      <Field label="來源地址">
        <Input value={draft.sourceUrl ?? ""} onChange={(event) => onChange({ sourceUrl: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="北緯">
          <Input type="number" step="0.000001" value={draft.lat} onChange={(event) => onChange({ lat: Number(event.target.value) })} />
        </Field>
        <Field label="東經">
          <Input type="number" step="0.000001" value={draft.lng} onChange={(event) => onChange({ lng: Number(event.target.value) })} />
        </Field>
      </div>
      {editState === "error" ? <p className="text-xs text-red-600">儲存修改失敗，請再試一次</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" onClick={onApply} disabled={editState === "saving"}>
          {editState === "saving" ? "儲存中..." : "儲存修改"}
        </Button>
      </div>
    </section>
  );
}

function NoteHistory({ entries }: { entries: SavedCommunityNote[] }) {
  if (!entries.length) {
    return <div className="rounded-lg border border-dashed border-border bg-white p-3 text-sm text-muted-foreground">目前沒有過去紀錄</div>;
  }

  return (
    <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-border bg-white p-2">
      {entries.map((entry) => (
        <article key={entry.id} className="rounded-md bg-muted p-2 text-sm">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{formatSavedAt(entry.savedAt)}</span>
            <span>{entry.score ? `${entry.score}/5` : "未評分"}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed">{entry.note || "未填寫筆記"}</p>
        </article>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function formatSavedAt(savedAt: string) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return savedAt;
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
