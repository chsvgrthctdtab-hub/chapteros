import { useState } from 'react';
import {
  Search,
  UserCheck,
  X,
  Loader2,
} from 'lucide-react';
import type { ActivityFormResponse, Member } from '@/types';

interface ManualMatchMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  response: ActivityFormResponse | null;
  members: Member[];
  isLoadingMembers?: boolean;
  onMatch: (memberId: string) => Promise<void>;
  isMatching?: boolean;
}

export function ManualMatchMemberDialog({
  isOpen,
  onClose,
  response,
  members,
  isLoadingMembers = false,
  onMatch,
  isMatching = false,
}: ManualMatchMemberDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  if (!isOpen || !response) return null;

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.studentId?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.className?.toLowerCase().includes(q)
    );
  });

  const handleConfirmMatch = async () => {
    if (!selectedMemberId) return;
    await onMatch(selectedMemberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink-navy/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="manual-match-member-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-hairline"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-cloud">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink-navy">Khớp thủ công với Hội viên</h3>
              <p className="text-[11px] text-slate-gray">Liên kết phản hồi Google Form vào hồ sơ Đơn vị</p>
            </div>
          </div>
          <button
            type="button"
            id="close-manual-match-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-gray hover:text-ink-navy hover:bg-pebble transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Response summary info */}
          <div className="p-3.5 bg-[#e6f0ff]/40 border border-[#d4e4fa] rounded-xl space-y-2 text-xs">
            <p className="font-bold text-ink-navy">Thông tin phản hồi từ Google Form:</p>
            <div className="grid grid-cols-2 gap-2 text-slate-gray">
              <div>
                <span className="text-mist-gray">Họ và tên:</span>{' '}
                <span className="font-semibold text-ink-navy">{response.fullName || '—'}</span>
              </div>
              <div>
                <span className="text-mist-gray">MSSV:</span>{' '}
                <span className="font-mono tabular-nums font-semibold text-ink-navy">{response.studentId || '—'}</span>
              </div>
              <div>
                <span className="text-mist-gray">Email:</span>{' '}
                <span className="text-ink-navy">{response.respondentEmail || '—'}</span>
              </div>
              <div>
                <span className="text-mist-gray">Lớp:</span>{' '}
                <span className="text-ink-navy">{response.className || '—'}</span>
              </div>
            </div>
          </div>

          {/* Search Member input */}
          <div className="space-y-1.5">
            <label htmlFor="search-match-member-input" className="block text-xs font-semibold text-slate-gray uppercase tracking-wider">
              Tìm kiếm Hội viên Chi hội để liên kết:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-mist-gray absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="search-match-member-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo Tên, MSSV, Email, Lớp..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-cloud border border-hairline rounded-lg text-ink-navy placeholder:text-mist-gray focus:outline-hidden focus:ring-2 focus:ring-signal-blue/20 focus:border-signal-blue"
              />
            </div>
          </div>

          {/* Members list */}
          <div className="border border-hairline rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-hairline">
            {isLoadingMembers ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-slate-gray">
                <Loader2 className="w-4 h-4 animate-spin text-signal-blue" />
                <span>Đang tải danh sách hội viên...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-gray">
                Không tìm thấy hội viên phù hợp
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedMemberId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full p-3 text-left flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#e6f0ff]/60 text-ink-navy ring-1 ring-inset ring-signal-blue/30'
                        : 'hover:bg-cloud text-slate-gray'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-ink-navy">{m.fullName}</p>
                        {m.studentId && (
                          <span className="font-mono tabular-nums text-[10px] bg-white text-ink-navy px-2 py-0.5 rounded-full border border-hairline font-semibold">
                            {m.studentId}
                          </span>
                        )}
                        {m.className && (
                          <span className="text-[10px] text-slate-gray">{m.className}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-gray mt-0.5">
                        {m.email && <span className="truncate">{m.email}</span>}
                        {m.phone && <span className="font-mono tabular-nums">• {m.phone}</span>}
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="selected_member"
                      checked={isSelected}
                      onChange={() => setSelectedMemberId(m.id)}
                      className="rounded-full text-signal-blue focus:ring-signal-blue shrink-0"
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hairline">
            <button
              type="button"
              id="cancel-match-member-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-gray hover:text-ink-navy hover:bg-pebble border border-hairline rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              id="confirm-match-member-btn"
              disabled={!selectedMemberId || isMatching}
              onClick={handleConfirmMatch}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-[#005be0] rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isMatching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang liên kết...</span>
                </>
              ) : (
                <span>Xác nhận khớp hội viên</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
